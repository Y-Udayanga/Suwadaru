export interface NutritionNote { id:string; child_id:string; body:string; sender:'user'|'assistant'; created_at:string }
export interface NutritionService { list(childId:string):Promise<NutritionNote[]>; add(childId:string,body:string):Promise<NutritionNote> }
