#pragma once
#include <Arduino.h>
#include <cstddef>
#include <cstdint>

struct LogEntry {
  uint32_t millis;
  uint32_t rollover;
  uint32_t temperature;
};

class Logger{
  private:
    LogEntry* _buffer;
    int _maxSize;
    int _head;
    bool _isFull;
    Logger();
  public:
    Logger(const Logger&) = delete;
    void operator=(const Logger&) = delete;
    static Logger& getLogger(){static Logger instance; return instance;}
    static bool begin();
    void append(uint32_t millis, uint32_t rollover, uint32_t temperature);
    bool getEntryAt(int index, LogEntry& output);
    int getTotalEntries() const;
    size_t size() const;
};