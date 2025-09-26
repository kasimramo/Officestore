SELECT
  u.email,
  u.name,
  COUNT(m.id) as org_count,
  CASE
    WHEN COUNT(m.id) > 0 THEN 'Has Organization'
    ELSE 'No Organization'
  END as status
FROM "User" u
LEFT JOIN "Membership" m ON u.id = m."userId"
GROUP BY u.id, u.email, u.name
ORDER BY u.email;