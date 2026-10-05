#pragma once
#include <cstdint>
#include <Arduino.h>
static constexpr uint64_t PID_INTERVAL = 2 * 1000;



class PIDController {
public:
  PIDController() {
    windowSize = PID_INTERVAL; //2s
    windowStartTime = millis();
  }
  void Update(uint32_t targetTemp, uint32_t currentTemp);

private:
  double kp = 1.33;
  double ki = 0.96;
  double kd = 0.16;
  uint64_t windowSize;
  uint64_t windowStartTime;
  double integral = 0.0;
  double lastError = 0.0;
  uint64_t lastTime = 0;
};