export type UserProperties = {
    id: string,
    email: string
}

export type BookProperties = {
    id: string,
    title: string,
    creator: UserProperties
}