export class LoginUserDto {
    auth: {
        accessToken: string
        reflashToken: string
    }
    user: {
        id: string
        email: string
        firstname: string
        lastname: string
        cep: string
    }
    roles: any[]
    permissions: any
    menus: any
    profiles: any
}