export interface ResultResponse<DataType> {
  status: string; // possible values: success, error, warning, info
  message?: string;
  data?: DataType;
}
