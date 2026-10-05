#include "PIDController.h"
#include <cstdint>
#include <sys/types.h>
extern uint8_t RELAY;


void PIDController::Update(uint32_t targetTemp, uint32_t currentTemp){
  uint64_t now = millis();
  if(lastTime == 0){
    lastTime = now;
  }

  double dt = (now - lastTime) / 1000.0;
  if(dt <= 0){
    return;
  }

  double error = targetTemp - currentTemp;
  double pOut = kp * error;

  if(abs(error) < 25.0) {
    integral += error * dt;

    if(integral > 50.0) integral = 50;
    else if(integral < -50.0) integral = -50;
  }
  else {
    integral = 0.0;
  }

  double iOut = ki * integral;

  double derivative = (error - lastError) / dt;
  double dOut = kd * derivative;

  double totalOutput = pOut + iOut + dOut;

  if(totalOutput > 1.0) totalOutput = 1.0;
  if(totalOutput < 0.0) totalOutput = 0.0;

  if(now - windowStartTime  >= windowStartTime){
    windowStartTime = now;
  }

  if((totalOutput * windowSize) > (now - windowStartTime)) {
    digitalWrite(RELAY, HIGH);
  }
  else {
    digitalWrite(RELAY, LOW);
  }

  lastError = error;
  lastTime = now;
}