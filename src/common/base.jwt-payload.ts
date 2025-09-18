export class BaseJwtPayload {
  name: string;
  email: string;
  userType: string;
  isAdmin: boolean;
  isTechnical: boolean;
  role: string;
  authorities: string[];
}
