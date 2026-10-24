import { database,check,listRows } from '@/services/health'
export interface NutritionNote {id:string;child_id:string;body:string;sender:'user'|'assistant';created_at:string}
export const nutritionService={
 list:(childId:string)=>listRows<NutritionNote>('nutrition_messages',childId),
 async add(childId:string,body:string) {const {data,error}=await database().from('nutrition_messages').insert({child_id:childId,body:body.trim()}).select().single();check(error);return data as NutritionNote}
}
