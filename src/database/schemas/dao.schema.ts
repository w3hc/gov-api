export interface Dao {
  address: string;
  createdAt: Date;
}

export interface DbSchema {
  daos: Dao[];
}
