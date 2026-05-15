import re

# Fix 1: Camp check-in socket emit payload
with open('app/api/camps/[id]/checkin/route.js', 'r', encoding='utf-8') as f:
    c = f.read()
c2 = c.replace(
    'global.io.emit("update:campOccupancy", { camp: updatedCamp, checkIn });',
    'global.io.emit("update:campOccupancy", { id: updatedCamp.id, currentOccupancy: updatedCamp.currentOccupancy, capacity: updatedCamp.capacity });'
)
with open('app/api/camps/[id]/checkin/route.js', 'w', encoding='utf-8') as f:
    f.write(c2)
print('camp socket:', 'replaced' if c2 != c else 'no change')

# Fix 2: Remove unused Suspense import in checkin page
with open('app/checkin/page.js', 'r', encoding='utf-8') as f:
    c = f.read()
c2 = c.replace('import { Suspense } from "react";\n', '').replace('import React, { Suspense } from "react";\n', 'import React from "react";\n')
with open('app/checkin/page.js', 'w', encoding='utf-8') as f:
    f.write(c2)
print('checkin imports:', 'replaced' if c2 != c else 'no change')
