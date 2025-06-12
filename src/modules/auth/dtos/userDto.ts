import { Exclude } from "class-transformer"

export class UserDto {
    id: string
    created_at: string
    updated_at: string
    deleted_at: string
    firstname: string
    lastname: string
    email: string
    cep: string
    age: number
    @Exclude()
    password:string
}