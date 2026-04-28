declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      email: string;
    };
    file?: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      destination: string;
      filename: string;
      path: string;
      size: number;
    };
  }
}
