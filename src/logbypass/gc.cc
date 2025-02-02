#include "gc.h"

#include "environment_data.h"
#include "library/common.h"
#include "logger.h"

namespace xprofiler {
using v8::GCType;
using v8::Isolate;

uint32_t TotalGcTimes() {
  Isolate* isolate = Isolate::GetCurrent();
  EnvironmentData* env_data = EnvironmentData::GetCurrent(isolate);
  if (env_data == nullptr) {
    return 0;
  }
  GcStatistics* gc_statistics = env_data->gc_statistics();
  return gc_statistics->total_gc_times;
}

uint32_t TotalGcDuration() {
  Isolate* isolate = Isolate::GetCurrent();
  EnvironmentData* env_data = EnvironmentData::GetCurrent(isolate);
  if (env_data == nullptr) {
    return 0;
  }
  GcStatistics* gc_statistics = env_data->gc_statistics();
  return gc_statistics->total_gc_duration;
}

// gc prologue hook
NAN_GC_CALLBACK(GCPrologueCallback) {
  EnvironmentData* env_data = EnvironmentData::GetCurrent(isolate);
  GcStatistics* gc_statistics = env_data->gc_statistics();
  Mutex::ScopedLock lock(gc_statistics->mutex);
  gc_statistics->start = uv_hrtime();
}

// gc epilogue hook
NAN_GC_CALLBACK(GCEpilogueCallback) {
  EnvironmentData* env_data = EnvironmentData::GetCurrent(isolate);
  GcStatistics* gc_statistics = env_data->gc_statistics();
  Mutex::ScopedLock lock(gc_statistics->mutex);

  uint64_t now = uv_hrtime();
  uint64_t start = gc_statistics->start;
  if (start == 0 || now < start) {
    return;
  }

  gc_statistics->total_gc_times++;
  uint32_t duration = static_cast<uint32_t>((now - start) / 10e5);  // cost, ms

  // check duration is legal
  if (duration >= 5 * 60 * 1000) {
    return;
  }

  // reset gc start time
  gc_statistics->start = 0;

  gc_statistics->total_gc_duration += duration;
  gc_statistics->gc_time_during_last_record += duration;

  if (type == GCType::kGCTypeScavenge) {
    gc_statistics->total_scavange_duration += duration;
    gc_statistics->scavange_duration_last_record += duration;
  }

  if (type == GCType::kGCTypeMarkSweepCompact) {
    gc_statistics->total_marksweep_duration += duration;
    gc_statistics->marksweep_duration_last_record += duration;
  }

  if (type == GCType::kGCTypeIncrementalMarking) {
    gc_statistics->total_incremental_marking_duration += duration;
    gc_statistics->incremental_marking_duration_last_record += duration;
  }
}

void InitGcStatusHooks(EnvironmentData* env_data) {
  env_data->AddGCPrologueCallback(GCPrologueCallback);
  env_data->AddGCEpilogueCallback(GCEpilogueCallback);
}

void WriteGcStatusToLog(EnvironmentData* env_data, bool log_format_alinode) {
  GcStatistics* gc_statistics = env_data->gc_statistics();
  Mutex::ScopedLock lock(gc_statistics->mutex);

  InfoT("gc", env_data->thread_id(),
        "uptime: %lu\t"
        "total_gc_times: %lu\t"
        "total_gc_duration: %lu\t"
        "total_scavange_duration: %lu\t"
        "total_marksweep_duration: %lu\t"
        "total_incremental_marking_duration: %lu\t"
        "gc_time_during_last_record: %lu\t"
        "scavange_duration_last_record: %lu\t"
        "marksweep_duration_last_record: %lu\t"
        "incremental_marking_duration_last_record: %lu",
        env_data->GetUptime(),  // uptime, s
        // total
        gc_statistics->total_gc_times, gc_statistics->total_gc_duration,
        gc_statistics->total_scavange_duration,
        gc_statistics->total_marksweep_duration,
        gc_statistics->total_incremental_marking_duration,
        // last record
        gc_statistics->gc_time_during_last_record,
        gc_statistics->scavange_duration_last_record,
        gc_statistics->marksweep_duration_last_record,
        gc_statistics->incremental_marking_duration_last_record);
  // reset last record
  gc_statistics->reset();
}
}  // namespace xprofiler
