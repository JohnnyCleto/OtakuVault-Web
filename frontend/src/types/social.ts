import type {Kind} from './media';
export type SocialUser={id:string;name:string;avatar:string;bio:string;createdAt?:string};
export type Review={id:string;userId:string;author:SocialUser;mediaId:number;mediaType:Kind;mediaFormat:string;mediaTitle:string;mediaCover:string;title:string;body:string;score:number;spoiler:boolean;createdAt:string;updatedAt:string};
export type ReviewsPage={items:Review[];hasMore:boolean};
export type PublicCounts={followers:number;following:number;reviews:number;total:number;favorites:number;animes:number;novels:number;mangas:number;current:number;completed:number};
export type PublicData={user:SocialUser;counts:PublicCounts;isOwn:boolean;isFollowing:boolean;showLibrary:boolean;showActivity:boolean};
export type PublicEntry={mediaId:number;mediaType:Kind;mediaFormat:string;title:string;cover:string;status:string;progress:number;favorite:boolean;total?:number;updatedAt:string};
export type Activity={id:string;user?:SocialUser;action:'REVIEW'|'LIBRARY';mediaId:number;mediaType:Kind;mediaTitle:string;mediaCover:string;createdAt:string};
