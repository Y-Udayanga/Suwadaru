import type { GrowthService } from '@/services/contracts'
import type { GrowthMeasurement } from '@/types'
import { database, check, listRows } from '@/services/health'
import { childService } from '@/services/children'
type Row = {id:string;child_id:string;measured_on:string;weight_kg:number|null;length_height_cm:number|null;head_circumference_cm:number|null;source:'parent_reported'}
const map = (r:Row):GrowthMeasurement => ({id:r.id,childId:r.child_id,measuredOn:r.measured_on,weightKg:r.weight_kg??undefined,lengthHeightCm:r.length_height_cm??undefined,headCircumferenceCm:r.head_circumference_cm??undefined,source:r.source})
export const growthService:GrowthService = {
  async list(id) { return (await listRows<Row>('growth_measurements',id)).map(map).sort((a,b)=>a.measuredOn.localeCompare(b.measuredOn)) },
  async addMeasurement(input) {
    const {data,error}=await database().from('growth_measurements').insert({child_id:input.childId,measured_on:input.measuredOn,weight_kg:input.weightKg,length_height_cm:input.lengthHeightCm,head_circumference_cm:input.headCircumferenceCm}).select().single(); check(error); return map(data)
  },
  async getReferenceSeries(childId) {
    const child=await childService.get(childId)
    const {data,error}=await database().from('growth_references').select('*').eq('sex',child.sex).eq('active',true).order('age_months'); check(error)
    return {childId,indicator:'weight_for_age',sex:child.sex,provenance:data?.length?'who':'unavailable',sourceLabel:data?.[0]?.source_url??'No verified reference data loaded',sourceVersion:data?.[0]?.source_version??'',clinicalStatus:'not_assessed',points:(data??[]).map(r=>({ageMonths:r.age_months,sdMinus2Kg:r.sd_minus2_kg,sdMinus1Kg:r.sd_minus1_kg,medianKg:r.median_kg,sdPlus1Kg:r.sd_plus1_kg,sdPlus2Kg:r.sd_plus2_kg}))}
  }
}
