#include "core0__interface.h"

void uiTask(void *pvParameters) {


    // temporary display values
  //  tft.init(240,240)
  //  tft.fillscreen(ILI9341_BLACK);
  //  tft.setTextColor(ILI9341_WHITE);
  //  tft.setTextSize(2);
  //  tft.setCursor(10,10);
  //  tft.print("System Ready");

  while(true){
  //neopixelWrite(RGB_BUILTIN, 0, 0, 0);
  //if(ESP.getFreeHeap() < 231200){
  log_d("Free Heap: %lu bytes\n", (unsigned long)ESP.getFreeHeap());
  //}

    vTaskDelay(pdMS_TO_TICKS(2000));
  }
}