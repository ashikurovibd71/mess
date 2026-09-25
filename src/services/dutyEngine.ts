import { DutySchedule, DutySwapRequest, DutyType, MealType, User } from '../types';

export interface MemberDutyStat {
  memberId: string;
  memberName: string;
  bazarCount: number;
  cookingCount: number;
  cleaningCount: number;
  otherCount: number;
  totalCompleted: number;
  totalMissed: number;
  totalAssigned: number;
}

/**
 * Calculates duty completion statistics for fair distribution tracking.
 */
export function calculateDutyStats(
  members: User[],
  duties: DutySchedule[]
): MemberDutyStat[] {
  return members.map((member) => {
    const memberDuties = duties.filter((d) => d.memberId === member.id);

    let bazarCount = 0;
    let cookingCount = 0;
    let cleaningCount = 0;
    let otherCount = 0;
    let totalCompleted = 0;
    let totalMissed = 0;

    memberDuties.forEach((d) => {
      if (d.status === 'COMPLETED') {
        totalCompleted++;
        if (d.dutyType === 'BAZAR') bazarCount++;
        else if (d.dutyType === 'COOKING') cookingCount++;
        else if (d.dutyType === 'CLEANING') cleaningCount++;
        else otherCount++;
      } else if (d.status === 'MISSED') {
        totalMissed++;
      }
    });

    return {
      memberId: member.id,
      memberName: member.name,
      bazarCount,
      cookingCount,
      cleaningCount,
      otherCount,
      totalCompleted,
      totalMissed,
      totalAssigned: memberDuties.length
    };
  });
}

/**
 * Generates an automatic fair duty rotation roster.
 * @param startDateStr "YYYY-MM-DD"
 * @param days Number of days (e.g. 7, 15, 30)
 * @param activeMembers List of active members to rotate
 * @param messId Mess ID
 * @param assignedBy Admin or Cashier User ID
 * @param dutyTypes Selected duties to rotate (e.g., ['BAZAR', 'COOKING', 'CLEANING'])
 */
export function generateDutyRotation(
  startDateStr: string,
  days: number,
  activeMembers: User[],
  messId: string,
  assignedBy: string,
  includeBazar: boolean = true,
  includeCooking: boolean = true,
  includeCleaning: boolean = true
): DutySchedule[] {
  if (activeMembers.length === 0 || days <= 0) return [];

  const newDuties: DutySchedule[] = [];
  const baseDate = new Date(startDateStr);

  const memberCount = activeMembers.length;

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + dayOffset);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Stagger rotation indices so the same member doesn't get all duties on the same day!
    // Bazar index
    if (includeBazar) {
      const bazarMember = activeMembers[dayOffset % memberCount];
      newDuties.push({
        id: `duty-bazar-${dateStr}-${Math.random().toString(36).substring(2, 7)}`,
        messId,
        memberId: bazarMember.id,
        dutyType: 'BAZAR',
        date: dateStr,
        status: 'ASSIGNED',
        assignedBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Cooking index (staggered by +1 for lunch, +2 for dinner)
    if (includeCooking) {
      // Lunch
      const lunchMember = activeMembers[(dayOffset + 1) % memberCount];
      newDuties.push({
        id: `duty-cook-lunch-${dateStr}-${Math.random().toString(36).substring(2, 7)}`,
        messId,
        memberId: lunchMember.id,
        dutyType: 'COOKING',
        mealType: 'LUNCH',
        date: dateStr,
        status: 'ASSIGNED',
        assignedBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Dinner
      const dinnerMember = activeMembers[(dayOffset + 2) % memberCount];
      newDuties.push({
        id: `duty-cook-dinner-${dateStr}-${Math.random().toString(36).substring(2, 7)}`,
        messId,
        memberId: dinnerMember.id,
        dutyType: 'COOKING',
        mealType: 'DINNER',
        date: dateStr,
        status: 'ASSIGNED',
        assignedBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Cleaning index (staggered by +3)
    if (includeCleaning) {
      const cleaningMember = activeMembers[(dayOffset + 3) % memberCount];
      newDuties.push({
        id: `duty-clean-${dateStr}-${Math.random().toString(36).substring(2, 7)}`,
        messId,
        memberId: cleaningMember.id,
        dutyType: 'CLEANING',
        date: dateStr,
        status: 'ASSIGNED',
        assignedBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  return newDuties;
}
