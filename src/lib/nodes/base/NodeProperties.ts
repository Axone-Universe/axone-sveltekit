export type UserProperties = {
    id: string,
    name: string,
    email: string
}

export type BookProperties = {
    id: string,
    title: string,
    creator: UserProperties
}