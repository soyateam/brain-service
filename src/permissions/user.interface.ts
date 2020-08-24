export interface IUser {
  _id?: string;
  userID: string;
  role: ROLE;
}

export enum ROLE {
  READ = "READ",
  WRITE = "WRITE",
}
