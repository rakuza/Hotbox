
#ifndef OPERATIONAL_STATUS_H
#define OPERATIONAL_STATUS_H
enum class OperationStatus : uint8_t {
  idle = 0,
  paused = 1,
  running = 2,
};
#endif 