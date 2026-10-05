const second = 1000;
const minute = 60*second;
const hour = minute * 60;
export function TemperatureFormatter(temp: number):string {
  return `${temp.toFixed(2)}°C`
} 

export function DurationFormatter(duration:number):string {
  const hours = Math.floor(duration / hour);
  const minutes = Math.floor((duration % hour) / minute);
  const seconds = Math.floor(((duration % hour) % minute) / second);

  return `${hours.toString(10).padStart(2,"0")}:${minutes.toString(10).padStart(2,"0")}:${seconds.toString(10).padStart(2,"0")}`;
}