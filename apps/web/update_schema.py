import sys

filepath = r"e:\Users\PC\Documents\ANTIGRAVITY\BRIVIO\brivio\apps\web\prisma\schema.prisma"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add notes relation to Project model
target_relation = "sprints      Sprint[]\n\n  @@map(\"projects\")\n}"
replacement_relation = "sprints      Sprint[]\n  notes        ProjectNote[]\n\n  @@map(\"projects\")\n}"

if target_relation in content:
    content = content.replace(target_relation, replacement_relation)
else:
    print("Could not find relation insertion point.")
    sys.exit(1)

# Add ProjectNote model to the end
new_model = """
model ProjectNote {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  project_id     String    @db.Uuid
  content        String
  author_name    String?   @default("Cliente")
  is_from_client Boolean   @default(true)
  created_at     DateTime? @default(now()) @db.Timestamptz(6)

  project        Project   @relation(fields: [project_id], references: [id], onDelete: Cascade)

  @@map("project_notes")
}
"""

content += new_model

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Successfully updated schema.prisma.")
