import { useCallback } from 'react'
import { Link } from 'react-router'
import { useChild } from '@/features/children'
import { useAuth } from '@/features/auth'
import { useLiveRecords } from '@/hooks/useLiveRecords'
import { growthService } from '@/features/growth/growthService'
import { vaccinationService } from '@/features/vaccinations/vaccinationService'
import { appointmentService } from '@/features/appointments/appointmentService'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/hooks/useLanguage'

const tables=['growth_measurements','vaccination_records','clinic_appointments','children','child_caregivers']
export function DashboardPage() {
 const {children,selectedChild,isLoading,error}=useChild(); const {session}=useAuth();const id=selectedChild?.id
 const {t,language}=useLanguage(); const isSi=language==='si'
 const load=useCallback(async()=>{if(!id)return null;const [growth,doses,appointments]=await Promise.all([growthService.list(id),vaccinationService.getRecords(id),appointmentService.list(id)]);return {growth,doses,appointments,loadedAt:Date.now()}},[id])
 const records=useLiveRecords(load,tables)
 const next=records.data?.appointments.filter(a=>a.status==='scheduled'&&Date.parse(a.scheduledAt)>=(records.data?.loadedAt??0)).sort((a,b)=>a.scheduledAt.localeCompare(b.scheduledAt))[0]
 const last=records.data?.growth.at(-1)
 return <div className="max-w-5xl space-y-6"><PageHeader title={(isSi?'ආයුබෝවන්, ':'Welcome, ')+(session?.displayName??(isSi?'සත්කාරක':'Caregiver'))} subtitle={isSi?'ඔබේ පවුලේ සුරැකි සෞඛ්‍ය සටහන්.':'Your family’s saved records.'}/>
 {isLoading?<p role="status">{isSi?'දරුවන්ගේ තොරතුරු පූරණය වෙමින්…':'Loading children…'}</p>:error?<p role="alert">{error}</p>:children.length===0?<section className="rounded-2xl border bg-card p-8"><h2 className="font-semibold text-xl">{isSi?'ඔබේ පළමු දරුවා එක් කරන්න':'Add your first child'}</h2><p className="my-3">{isSi?'ඔබේ ගිණුමේ තවමත් ළමා පැතිකඩක් නොමැත.':'Your account has no child profiles yet.'}</p><Link className="text-primary underline" to="/children/new">{isSi?'දරුවෙකු එක් කරන්න':'Add child'}</Link></section>:<>
 <div className="flex flex-wrap gap-3">{children.map(c=><Link key={c.id} className="rounded-xl border bg-card p-4" to={'/children/'+c.id}>{c.name}</Link>)}</div>
 <h2 className="text-xl font-semibold">{selectedChild?.name}</h2>
 {records.error?<div role="alert">{records.error}<Button onClick={()=>void records.refresh()}>{t('common.cancel')}</Button></div>:records.loading?<p role="status">{isSi?'සෞඛ්‍ය සටහන් පූරණය වෙමින්…':'Loading health records…'}</p>:<div className="grid gap-4 sm:grid-cols-3">
 <Link to={'/children/'+id+'/growth'} className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">{isSi?'නවතම වර්ධන මිනුම':'Latest measurement'}</h3><p className="mt-2">{last?last.measuredOn+' · '+(last.weightKg===undefined?(isSi?'බර සටහන් කර නැත':'Weight not recorded'):last.weightKg+' kg'):(isSi?'මිනුම් සටහන් කර නොමැත':'No measurements recorded')}</p></Link>
 <Link to={'/children/'+id+'/vaccinations'} className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">{isSi?'ලබා දුන් එන්නත්':'Reported doses'}</h3><p className="mt-2">{records.data?.doses.length??0} {isSi?'සටහන්':'records'}</p></Link>
 <Link to={'/children/'+id+'/appointments'} className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">{isSi?'මීළඟ සායන හමුවීම':'Next appointment'}</h3><p className="mt-2">{next?next.clinicName+' · '+new Date(next.scheduledAt).toLocaleString():(isSi?'ඉදිරි සායන හමුවීම් නොමැත':'No upcoming appointments')}</p></Link>
 </div>}
 <Link className="text-primary underline" to={'/children/'+id+'/nutrition'}>{isSi?'පෝෂණ සහ ආහාර උපදෙස් (සුවදරු AI)':'Nutrition notes'}</Link></>}
 <p><Link className="text-primary underline" to="/todos">{isSi?'මගේ කාර්යයන් (Tasks)':'My tasks'}</Link></p></div>
}
