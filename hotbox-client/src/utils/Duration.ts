const minute = 60 * 1000;
const hour = 60 * minute;
const durationRegex = /(\d{2,})h?:?\s?(\d{2})m?/i

/**
 * Duration class for converting esp32 time to human readible
 */
export class Duration {

  millis: number;

  constructor(duration = 0) {
    this.millis = duration;
  }

  get duration(): string {
    const hours = Math.floor(this.millis / hour);
    const minutes = Math.floor((this.millis % hour) / minute);

    return `${hours.toString(10).padStart(2, "0")}h:${minutes.toString(10).padStart(2, "0")}m`;
  }

  set duration(duration: string) {
    const result = durationRegex.exec(duration);

    if (!result) {
      throw new Error("Could not parse duration");
    }
    const mins = Number.parseInt(result[1], 10);
    const hours = Number.parseInt(result[0], 10);;

    this.millis = (mins * minute) + (hours * hour);
  }

  /**
   * Takes in a XXh:XXm string and will turn it into a milliseconds equvelent
   * @param duration Raw string representing the duration
   * @returns success
   */
  parse(duration: string): boolean {
    const result = durationRegex.exec(duration);

    if (!result) {
      return false;
    }
    this.duration = duration;
    return true;
  }
}