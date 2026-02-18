export interface AlarmSound {
  id: string;
  name: string;
  description: string;
  filename: string;
}

export const ALARM_SOUNDS: AlarmSound[] = [
  {
    id: 'alarm1',
    name: 'Clásico',
    description: 'Beep tradicional de alarma',
    filename: 'alarm1.mp3',
  },
  {
    id: 'alarm2',
    name: 'Digital',
    description: 'Alarma electrónica moderna',
    filename: 'alarm2.mp3',
  },
  {
    id: 'alarm3',
    name: 'Suave',
    description: 'Melodía progresiva y suave',
    filename: 'alarm3.mp3',
  },
  {
    id: 'alarm4',
    name: 'Urgente',
    description: 'Alerta fuerte e insistente',
    filename: 'alarm4.mp3',
  },
  {
    id: 'alarm5',
    name: 'Campanitas',
    description: 'Tono melódico con campanitas',
    filename: 'alarm5.mp3',
  },
];

export const getAlarmSoundById = (filename: string): AlarmSound | undefined => {
  return ALARM_SOUNDS.find((sound) => sound.filename === filename);
};
