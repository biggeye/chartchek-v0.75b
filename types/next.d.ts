import { NextPage } from 'next'

export interface PageParams {
  [key: string]: string
}

export interface PageSearchParams {
  [key: string]: string | string[] | undefined
}

export interface PageProps {
  params: PageParams
  searchParams?: PageSearchParams
}

export type NextPageWithParams<P = {}, IP = P> = NextPage<PageProps & P, IP>
