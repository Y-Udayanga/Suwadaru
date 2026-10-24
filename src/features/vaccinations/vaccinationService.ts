import type { VaccinationService } from '@/services/contracts'
import type { VaccinationRecord } from '@/types'
import { database,check,listRows } from '@/services/health'
import { childService } from '@/services/children'
import { addCalendarMonths } from './calendarDate'
type Row={id:string;child_id:string;vaccine_code:string;administered_on:string;source:'parent_reported'}
const map=(r:Row):VaccinationRecord=>({id:r.id,childId:r.child_id,vaccineCode:r.vaccine_code,administeredOn:r.administered_on,source:r.source})
export const vaccinationService:VaccinationService={
  async getSchedule(childId) {
    const child=await childService.get(childId)
    const {data,error}=await database().from('vaccination_schedule').select('*').eq('active',true).order('age_months');check(error)
    return (data??[]).map(r=>({id:r.id,vaccineCode:r.vaccine_code,vaccineName:r.vaccine_name,ageMonths:r.age_months,dueDate:addCalendarMonths(child.dateOfBirth,r.age_months),scheduleVersion:r.schedule_version,sourceUrl:r.source_url}))
  },
  async getRecords(id) { return (await listRows<Row>('vaccination_records',id)).map(map) },
  async addReportedDose(input) {
    const {data,error}=await database().from('vaccination_records').insert({child_id:input.childId,vaccine_code:input.vaccineCode.trim(),administered_on:input.administeredOn}).select().single();check(error);return map(data)
  }
}
