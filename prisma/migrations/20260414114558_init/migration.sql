-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PATIENT', 'CAREGIVER');

-- CreateEnum
CREATE TYPE "MedStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'TAKEN', 'MISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "location" TEXT,
    "language" TEXT NOT NULL DEFAULT 'es',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "allergies" TEXT[],
    "conditions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,
    "intervalHours" INTEGER NOT NULL,
    "instructions" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "MedStatus" NOT NULL DEFAULT 'ACTIVE',
    "schedule" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationEvent" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateTimeScheduled" TIMESTAMP(3) NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "imc" DOUBLE PRECISION,
    "sleepHours" DOUBLE PRECISION,
    "exerciseMinutes" INTEGER,
    "waterLiters" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaregiverRelation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaregiverRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HealthData_userId_key" ON "HealthData"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CaregiverRelation_patientId_caregiverId_key" ON "CaregiverRelation"("patientId", "caregiverId");

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationEvent" ADD CONSTRAINT "MedicationEvent_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationEvent" ADD CONSTRAINT "MedicationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthData" ADD CONSTRAINT "HealthData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaregiverRelation" ADD CONSTRAINT "CaregiverRelation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaregiverRelation" ADD CONSTRAINT "CaregiverRelation_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
