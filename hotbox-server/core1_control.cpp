
#include "core1_control.h"
#include "State.h"
#include "PIDController.h"

// #if ENABLE_MAX6675
// #include <MAX6675.h>
// #endif

// #if ENABLE_MAX31855
// #include <MAX31855.h>
// #endif



void deviceTask(void *pvParameters) {

    AppState& state = AppState::getInstance();
    PIDController tempController = {};
    uint32_t previousMillis = 0;
    uint32_t lastPidCompute = 0;
    uint32_t lastThermocoupleRead = 0;
    while (1) {
      uint32_t currentMillis = millis();
      if(currentMillis < previousMillis){
        state.millisRollover += 1;
      }
      previousMillis = currentMillis;
      
      if(currentMillis - lastThermocoupleRead >= THERMOCOUPLE_READ_WAIT){
        lastThermocoupleRead = currentMillis;
        double currentTemperature = thermocouple.read();

        state.lastTemp = currentTemperature;
      }

      if(currentMillis - lastPidCompute >= PID_INTERVAL){
        lastPidCompute = currentMillis;
        tempController.Update(state.targetTemp, state.lastTemp);
      }

      vTaskDelay(pdMS_TO_TICKS(200));
  }
}