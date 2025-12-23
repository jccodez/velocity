import { NextRequest, NextResponse } from "next/server";
import { getAllCampaigns, updateCampaignStatusByDates } from "@/lib/firebase/campaigns";

/**
 * API Route to auto-update campaign statuses based on dates
 * Can be called via cron job or manually
 * 
 * Usage: GET /api/campaigns/update-status
 */
export async function GET(request: NextRequest) {
  try {
    // Dynamically import to avoid build issues
    const { getAllCampaigns, updateCampaignStatusByDates } = await import("@/lib/firebase/campaigns");
    
    const campaigns = await getAllCampaigns();
    const results = [];

    for (const campaign of campaigns) {
      if (!campaign.id) continue;
      
      try {
        const result = await updateCampaignStatusByDates(campaign.id);
        if (result.updated) {
          results.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            oldStatus: campaign.status,
            newStatus: result.newStatus,
          });
        }
      } catch (error: any) {
        console.error(`Error updating campaign ${campaign.id}:`, error);
        results.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${campaigns.length} campaign(s)`,
      updated: results.filter(r => r.newStatus).length,
      results,
    });
  } catch (error: any) {
    console.error("Error updating campaign statuses:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update campaign statuses" },
      { status: 500 }
    );
  }
}

