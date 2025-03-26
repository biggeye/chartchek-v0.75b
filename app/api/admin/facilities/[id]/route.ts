/*
this route will be for operations  with specific facility tables in supabase

BASIC INFORMATION
-capacity (how many patients)
-staff {[
title: string,
username: string,
userId: uuid, 
name: string,
role: string,
email: string,
phone: string,
address: string,
address2: string,
address3: string,
city: string,
state: string,
zip: string,
]} 

STATISTIC TRACKING (timestamps)
-evaluation [
createdAt- timestamp
completedAt- timestamp
evaluationId- uuid
]

-curriculum [
objects representing a full treatment plan over a 7 day period
**this might need to be a subtable

]

*/