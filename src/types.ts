export enum Type {
  Value = 'value',
  End = 'end',
  InternalError = 'err',
  Anomaly = 'an',
}

export interface IErrorValue {
  message: string;
  data?: { [key: string]: string | number | boolean };
}

export interface IValueMessage<T> {
  type: Type.Value;
  payload: T;
}

export interface IEndMessage {
  type: Type.End;
}

export interface IErrorMessage {
  type: Type.InternalError | Type.Anomaly;
  payload: IErrorValue;
}

export type IMessage<T> = IValueMessage<T> | IEndMessage | IErrorMessage;

export class Anomaly extends Error {
  public data: {
    [key: string]: string | number | boolean;
  };

  constructor(message: string, data = {}) {
    super(message);
    this.data = data;
  }
}
