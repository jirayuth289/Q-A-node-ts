class HttpException extends Error {
    public status: number;
    public message: string;
    public code: string;
  
    constructor(status: number, code: string, message: string) {
      super(message);
      this.status = status;
      this.code = code;
      this.message = message;
    }
  }
  
  export default HttpException;
  