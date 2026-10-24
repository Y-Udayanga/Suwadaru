import type { AppointmentService } from '@/services/contracts'
import type { ClinicAppointment, UpdateAppointmentInput } from '@/types'
import { database, check, listRows } from '@/services/health'
type Row={id:string;child_id:string;scheduled_at:string;clinic_name:string;purpose:string|null;status:ClinicAppointment['status']}
const map=(r:Row):ClinicAppointment=>({id:r.id,childId:r.child_id,scheduledAt:r.scheduled_at,clinicName:r.clinic_name,purpose:r.purpose??undefined,status:r.status})
async function update(id:string,input:UpdateAppointmentInput|{status:'cancelled'}) {
  const patch:Record<string,unknown>={}
  for (const [key,column] of Object.entries({scheduledAt:'scheduled_at',clinicName:'clinic_name',purpose:'purpose',status:'status'})) if(key in input) patch[column]=input[key as keyof typeof input]
  const {data,error}=await database().from('clinic_appointments').update(patch).eq('id',id).select().single(); check(error); return map(data)
}
export const appointmentService:AppointmentService & {complete(id:string):Promise<ClinicAppointment>}={
  async list(id) { return (await listRows<Row>('clinic_appointments',id)).map(map) },
  async create(input) { const {data,error}=await database().from('clinic_appointments').insert({child_id:input.childId,scheduled_at:input.scheduledAt,clinic_name:input.clinicName.trim(),purpose:input.purpose?.trim()||null}).select().single();check(error);return map(data) },
  update,cancel:id=>update(id,{status:'cancelled'}),complete:id=>update(id,{status:'completed'})
}
