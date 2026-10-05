#include "log.h"
#include <Arduino.h>
#include <cstddef>
#include <cstdint>

Logger::Logger() {
  _buffer = nullptr;
  _maxSize = 0;
  _head = 0;
  _isFull = false;
}

bool Logger::begin() {
  Logger &logger = getLogger();
  if (logger._buffer != nullptr)
    return true;

  size_t maxPSRAM = ESP.getMaxAllocPsram();
  size_t bytesToAllocate;

  logger._maxSize = maxPSRAM / sizeof(LogEntry);
  bytesToAllocate = logger._maxSize * sizeof(LogEntry);
  logger._buffer = (LogEntry*)ps_malloc(bytesToAllocate);

  if (logger._buffer == nullptr) {
    log_e("PS Ram allocation failed");
    return false;
  }

  return true;
}

void Logger::append(uint32_t millis, uint32_t rollover, uint32_t temperature) {
  if (_buffer == nullptr)
    return;

  _buffer[_head].temperature = temperature;
  _buffer[_head].millis = millis;
  _buffer[_head].rollover = rollover;

  _head++;

  if (_head >= _maxSize) {
    _head = 0;
    _isFull = true;
  }
}

bool Logger::getEntryAt(int index, LogEntry &output) {
  if (_buffer == nullptr)
    return false;

  int totalAvailable = getTotalEntries();

  if (index < 0 || index >= totalAvailable) {
    return false;
  }

  int actualIndex = index;
  if (_isFull) {
    actualIndex = (_head + index) % _maxSize;
  }

  output = _buffer[actualIndex];
  return true;
}

int Logger::getTotalEntries() const { return _isFull ? _maxSize : _head; }

size_t Logger::size() const{
  return getTotalEntries() * sizeof(LogEntry);
}