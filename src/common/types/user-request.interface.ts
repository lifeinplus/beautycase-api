export interface UserRequest {
  user?: {
    role?: string;
    userId?: string;
  };
  params: {
    id: string;
  };
}
