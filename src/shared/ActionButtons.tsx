import { SellOutlined, Shop2Outlined } from "@mui/icons-material";
import { IconButton, Link } from "@mui/material";
import React from "react";

export const ViewFlipkartListingButton: React.FC<{
  flipkartSerialNumber: string;
}> = ({ flipkartSerialNumber }) =>
    flipkartSerialNumber && flipkartSerialNumber.trim() !== '' ? (
      <Link
        title="View Flipkart Listing"
        href={`https://www.flipkart.com/product/p/itme?pid=${flipkartSerialNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={`view-flipkart-${flipkartSerialNumber}`}
      >
        <IconButton size="small">
          <Shop2Outlined />
        </IconButton>
      </Link>
    ) : null;

export const ViewAmazonListingButton: React.FC<{
  amazonSerialNumber: string;
}> = ({ amazonSerialNumber }) =>
    amazonSerialNumber && amazonSerialNumber.trim() !== '' ? (
      <Link
        title="View Amazon Listing"
        href={`https://www.amazon.in/sacred/dp/${amazonSerialNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={`view-amazon-${amazonSerialNumber}`}
      >
        <IconButton size="small">
          <Shop2Outlined />
        </IconButton>
      </Link>
    ) : null;

export const ShowProductEditPageButton: React.FC<{
  sku: string;
  platform: string;
}> = ({ sku, platform }) => (
  <Link
    title="Show Product Edit Page"
    target="_blank"
    rel="noopener noreferrer"
    href={platform === "flipkart" ? `https://seller.flipkart.com/index.html#dashboard/listings-management?listingState=ACTIVE&listingsSearchQuery=${sku}&partnerContext=ALL` : `https://sellercentral.amazon.in/myinventory/inventory?fulfilledBy=all&page=1&pageSize=25&searchField=all&searchTerm=${sku}&sort=date_created_desc&status=all&ref_=xx_invmgr_dnav_xx`}
  >
    <IconButton size="small">
      <SellOutlined />
    </IconButton>
  </Link>
);
