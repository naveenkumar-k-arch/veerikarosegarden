export interface MetturBranch {
  name: string;
  landmark?: string;
  type: 'HUB' | 'BRANCH' | 'AGENCY';
}

export interface MetturDistrict {
  district: string;
  branches: MetturBranch[];
}

export interface MetturStateCoverage {
  state: string;
  districts: MetturDistrict[];
}

export const METTUR_PARCEL_COVERAGE: MetturStateCoverage[] = [
  {
    state: 'Tamil Nadu',
    districts: [
      {
        district: 'Salem',
        branches: [
          { name: 'Salem Main Hub (Shevapet)', type: 'HUB' },
          { name: 'Attur Branch', type: 'BRANCH' },
          { name: 'Mettur Dam Town Branch', type: 'BRANCH' },
          { name: 'Omalur Branch', type: 'BRANCH' },
          { name: 'Sankari Branch', type: 'BRANCH' },
          { name: 'Edappadi Branch', type: 'BRANCH' },
          { name: 'Vazhapadi Branch', type: 'AGENCY' }
        ]
      },
      {
        district: 'Dharmapuri',
        branches: [
          { name: 'Pennagaram Branch (Nursery Direct)', type: 'BRANCH' },
          { name: 'Dharmapuri Town Main Office', type: 'HUB' },
          { name: 'Harur Branch', type: 'BRANCH' },
          { name: 'Palacode Branch', type: 'BRANCH' },
          { name: 'Pappireddipatti Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Krishnagiri',
        branches: [
          { name: 'Hosur Main Hub (Bagalur Rd)', type: 'HUB' },
          { name: 'Krishnagiri Old Bus Stand Branch', type: 'BRANCH' },
          { name: 'Pochampalli Branch', type: 'BRANCH' },
          { name: 'Uthangarai Branch', type: 'BRANCH' },
          { name: 'Denkanikottai Agency', type: 'AGENCY' },
          { name: 'Bargur Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Coimbatore',
        branches: [
          { name: 'Gandhipuram Central Hub', type: 'HUB' },
          { name: 'Ukkadam / Town Hall Branch', type: 'BRANCH' },
          { name: 'Singanallur Branch', type: 'BRANCH' },
          { name: 'RS Puram Branch', type: 'BRANCH' },
          { name: 'Pollachi Main Branch', type: 'BRANCH' },
          { name: 'Mettupalayam Branch', type: 'BRANCH' },
          { name: 'Sulur Branch', type: 'AGENCY' }
        ]
      },
      {
        district: 'Erode',
        branches: [
          { name: 'Erode Central Hub (Park Road)', type: 'HUB' },
          { name: 'Bhavani Branch', type: 'BRANCH' },
          { name: 'Gobichettipalayam Branch', type: 'BRANCH' },
          { name: 'Perundurai Branch', type: 'BRANCH' },
          { name: 'Sathyamangalam Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Tirupur',
        branches: [
          { name: 'Tirupur Old Bus Stand Hub', type: 'HUB' },
          { name: 'Avinashi Branch', type: 'BRANCH' },
          { name: 'Kangeyam Branch', type: 'BRANCH' },
          { name: 'Dharapuram Branch', type: 'BRANCH' },
          { name: 'Palladam Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Namakkal',
        branches: [
          { name: 'Namakkal Town Branch', type: 'BRANCH' },
          { name: 'Rasipuram Branch', type: 'BRANCH' },
          { name: 'Tiruchengode Branch', type: 'BRANCH' },
          { name: 'Paramathi Velur Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Chennai',
        branches: [
          { name: 'Koyambedu Central Parcel Hub', type: 'HUB' },
          { name: 'Parrys / George Town Branch', type: 'BRANCH' },
          { name: 'Guindy Industrial Estate Branch', type: 'BRANCH' },
          { name: 'Tambaram Sanatorium Branch', type: 'BRANCH' },
          { name: 'Ambattur OT Branch', type: 'BRANCH' },
          { name: 'T. Nagar / Kodambakkam Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Madurai',
        branches: [
          { name: 'Mattuthavani Main Parcel Hub', type: 'HUB' },
          { name: 'Simmakkal Branch', type: 'BRANCH' },
          { name: 'Periyar Bus Stand Branch', type: 'BRANCH' },
          { name: 'Thirumangalam Branch', type: 'BRANCH' },
          { name: 'Usilampatti Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Dindigul',
        branches: [
          { name: 'Dindigul Central Branch', type: 'HUB' },
          { name: 'Palani Town Branch', type: 'BRANCH' },
          { name: 'Oddanchatram Branch', type: 'BRANCH' },
          { name: 'Batlagundu Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Tiruchirappalli',
        branches: [
          { name: 'Trichy Central Hub (Palakkarai)', type: 'HUB' },
          { name: 'Thillai Nagar Branch', type: 'BRANCH' },
          { name: 'Srirangam Branch', type: 'BRANCH' },
          { name: 'Manapparai Branch', type: 'BRANCH' },
          { name: 'Thuraiyur Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Thanjavur',
        branches: [
          { name: 'Thanjavur Old Bus Stand Branch', type: 'BRANCH' },
          { name: 'Kumbakonam Main Branch', type: 'BRANCH' },
          { name: 'Pattukkottai Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Karur',
        branches: [
          { name: 'Karur Central Branch', type: 'BRANCH' },
          { name: 'Kulithalai Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Vellore',
        branches: [
          { name: 'Vellore Town Branch (Makkan)', type: 'HUB' },
          { name: 'Katpadi Branch', type: 'BRANCH' },
          { name: 'Gudiyatham Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Tiruvannamalai',
        branches: [
          { name: 'Tiruvannamalai Town Branch', type: 'BRANCH' },
          { name: 'Arani Branch', type: 'BRANCH' },
          { name: 'Cheyyar Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Cuddalore',
        branches: [
          { name: 'Cuddalore OT Branch', type: 'BRANCH' },
          { name: 'Panruti Branch', type: 'BRANCH' },
          { name: 'Chidambaram Branch', type: 'BRANCH' },
          { name: 'Neyveli Township Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Villupuram',
        branches: [
          { name: 'Villupuram Main Branch', type: 'BRANCH' },
          { name: 'Tindivanam Branch', type: 'BRANCH' },
          { name: 'Kallakurichi Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Theni',
        branches: [
          { name: 'Theni Town Branch', type: 'BRANCH' },
          { name: 'Periyakulam Branch', type: 'BRANCH' },
          { name: 'Bodinayakanur Branch', type: 'BRANCH' },
          { name: 'Cumbum Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Virudhunagar',
        branches: [
          { name: 'Virudhunagar Branch', type: 'BRANCH' },
          { name: 'Sivakasi Town Branch', type: 'BRANCH' },
          { name: 'Rajapalayam Branch', type: 'BRANCH' },
          { name: 'Aruppukkottai Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Tirunelveli',
        branches: [
          { name: 'Tirunelveli Junction Hub', type: 'HUB' },
          { name: 'Palayamkottai Branch', type: 'BRANCH' },
          { name: 'Tenkasi Branch', type: 'BRANCH' },
          { name: 'Sankarankovil Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Thoothukudi',
        branches: [
          { name: 'Tuticorin Main Branch', type: 'BRANCH' },
          { name: 'Kovilpatti Branch', type: 'BRANCH' },
          { name: 'Tiruchendur Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Kanyakumari',
        branches: [
          { name: 'Nagercoil Town Branch', type: 'BRANCH' },
          { name: 'Marthandam Branch', type: 'BRANCH' },
          { name: 'Thuckalay Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Pudukkottai',
        branches: [
          { name: 'Pudukkottai Town Branch', type: 'BRANCH' },
          { name: 'Aranthangi Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Sivaganga',
        branches: [
          { name: 'Karaikudi Central Branch', type: 'BRANCH' },
          { name: 'Sivaganga Town Branch', type: 'BRANCH' },
          { name: 'Devakottai Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Chengalpattu / Kanchipuram',
        branches: [
          { name: 'Kanchipuram Main Branch', type: 'BRANCH' },
          { name: 'Chengalpattu Town Branch', type: 'BRANCH' },
          { name: 'Maraimalai Nagar Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Tiruvallur',
        branches: [
          { name: 'Tiruvallur Town Branch', type: 'BRANCH' },
          { name: 'Avadi Branch', type: 'BRANCH' },
          { name: 'Ponneri Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Nilgiris (Foot / Hills)',
        branches: [
          { name: 'Mettupalayam Junction Hub', type: 'HUB' },
          { name: 'Coonoor Road Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Ranipet / Tirupattur',
        branches: [
          { name: 'Ambur Branch', type: 'BRANCH' },
          { name: 'Vaniyambadi Branch', type: 'BRANCH' },
          { name: 'Ranipet / Walajapet Branch', type: 'BRANCH' }
        ]
      }
    ]
  },
  {
    state: 'Karnataka',
    districts: [
      {
        district: 'Bengaluru Urban / Rural',
        branches: [
          { name: 'Kalasipalya Central Hub', type: 'HUB' },
          { name: 'Peenya Industrial Area Branch', type: 'BRANCH' },
          { name: 'Yeshwanthpur Branch', type: 'BRANCH' },
          { name: 'Bommasandra / Electronic City Hub', type: 'BRANCH' },
          { name: 'KR Puram / Whitefield Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Mysuru',
        branches: [
          { name: 'Mysuru City Central Branch', type: 'BRANCH' },
          { name: 'Mandya Town Branch', type: 'BRANCH' }
        ]
      }
    ]
  },
  {
    state: 'Puducherry',
    districts: [
      {
        district: 'Puducherry',
        branches: [
          { name: 'Puducherry Town Main Branch (Maraimalai Adigal Salai)', type: 'HUB' },
          { name: 'Karaikal Branch', type: 'BRANCH' }
        ]
      }
    ]
  },
  {
    state: 'Kerala',
    districts: [
      {
        district: 'Palakkad',
        branches: [
          { name: 'Palakkad Town Central Branch', type: 'BRANCH' },
          { name: 'Walayar Border Delivery Hub', type: 'HUB' }
        ]
      }
    ]
  }
];

export function getMetturStateCoverage(stateName: string): MetturDistrict[] {
  const norm = (stateName || '').toLowerCase().trim();
  const match = METTUR_PARCEL_COVERAGE.find(s => s.state.toLowerCase() === norm);
  return match?.districts || [];
}

export function isMetturServiceAvailable(stateName: string, districtName?: string): boolean {
  const normState = (stateName || '').toLowerCase().trim();
  const stateMatch = METTUR_PARCEL_COVERAGE.find(s => s.state.toLowerCase() === normState);
  if (!stateMatch) return false;
  if (!districtName || !districtName.trim()) return true;

  const normDist = districtName.toLowerCase().trim();
  return stateMatch.districts.some(d =>
    d.district.toLowerCase() === normDist ||
    normDist.includes(d.district.toLowerCase()) ||
    d.district.toLowerCase().includes(normDist)
  );
}

export function getBranchesForDistrict(stateName: string, districtName: string): MetturBranch[] {
  const districts = getMetturStateCoverage(stateName);
  const normDist = (districtName || '').toLowerCase().trim();
  const found = districts.find(d =>
    d.district.toLowerCase() === normDist ||
    normDist.includes(d.district.toLowerCase()) ||
    d.district.toLowerCase().includes(normDist)
  );
  return found?.branches || [];
}
