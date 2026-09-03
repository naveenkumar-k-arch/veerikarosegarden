/**
 * Veerika Rose Garden - Global Site Configuration & Maintenance Mode
 */

export interface MaintenanceConfig {
  /**
   * Set to `true` to immediately put the site into Maintenance Mode for visitors & Google.
   * Set to `false` when ready to go live again.
   */
  enabled: boolean;
  
  /**
   * Mode of maintenance:
   * - 'full': Full-page maintenance screen blocking all visitor browsing (admins/staff can still bypass).
   * - 'banner': Site remains browsable, but shows a prominent top maintenance alert banner.
   */
  mode: 'full' | 'banner';

  /** Primary title displayed on the maintenance page */
  title: string;

  /** Tamil subtitle for local Tamil Nadu customers */
  titleTamil: string;

  /** Explanatory message */
  message: string;

  /** Estimated completion time */
  estimatedDuration: string;

  /** Support & order contact info */
  primaryPhone: string;
  secondaryPhone: string;
  whatsappNumber: string;
  supportEmail: string;

  /** Nursery location */
  location: string;

  /** Secret passkey to allow dev/admin to preview the site from URL: e.g. ?preview=vrg2026 */
  previewPasskey: string;
}

export const SITE_CONFIG = {
  maintenance: {
    enabled: false, // Set to false: Store is live in full production
    mode: 'full',  // 'full' or 'banner'
    title: 'We are Temporarily Updating Our Nursery System',
    titleTamil: 'தள மேம்பாட்டு பணிகள் நடைபெற்று வருகின்றன. விரைவில் செயல்படும்!',
    message: 'Veerika Rose Garden is currently undergoing scheduled system updates and catalog improvements to serve you better. We will be back online shortly!',
    estimatedDuration: 'Undergoing Routine Maintenance & System Enhancements',
    primaryPhone: '+91 72008 26129',
    secondaryPhone: '+91 93615 40714',
    whatsappNumber: '919361540714',
    supportEmail: 'support@veerikarosegarden.com',
    location: 'Pennagaram, Dharmapuri District, Tamil Nadu',
    previewPasskey: 'vrg2026',
  } as MaintenanceConfig,
};
