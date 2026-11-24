/**
 * Curated high-visibility outages and fallback recent data.
 * Every claim is backed by verified primary engineering reports or independent telemetry.
 */

export const FAMOUS_OUTAGES = [
  {
    id: 'crowdstrike',
    tab: 'CrowdStrike',
    date: 'July 19, 2024',
    impactLine: '8.5 million Windows computers · Airlines, hospitals, and banks',
    headline: 'One untested update locked millions of screens at once.',
    story:
      'A security company sent a routine update to Windows computers worldwide all at the same moment—without releasing it in slow waves first. A small mistake inside that file crashed Windows itself, trapping airport departure boards, hospital check-in desks, and bank counters in restart loops.',
    after:
      'The faulty file was pulled in 79 minutes, though IT teams had to unlock millions of computers by hand. Afterward, the company switched to gradual, wave-by-wave rollouts.',
    analogy:
      'Imagine a locksmith mailing a brand-new master key to 8.5 million buildings on the same morning without testing it on one door—and the key jams every lock shut from the inside.',
    technical:
      'CrowdStrike\'s Rapid Response Content update ("Channel File 291") contained a field-count mismatch (21 inputs vs. 20 expected) causing an out-of-bounds memory read inside the kernel-mode Falcon sensor driver.',
    stageTitle: 'What happened vs. what waves would have done',
    prompt: 'Compare pushing to everyone at once (what happened) against releasing in slow waves.',
    sources: [
      {
        label: 'CrowdStrike · Preliminary Post Incident Report',
        url: 'https://www.crowdstrike.com/en-us/blog/falcon-content-update-preliminary-post-incident-report/'
      },
      {
        label: 'Microsoft · Helping Customers Through the Outage',
        url: 'https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/'
      },
      {
        label: 'CISA · Official Alert',
        url: 'https://www.cisa.gov/news-events/alerts/2024/07/19/widespread-it-outage-due-crowdstrike-update'
      }
    ]
  },
  {
    id: 'facebook',
    tab: 'Facebook',
    date: 'October 4, 2021',
    impactLine: '3.5 billion people · Facebook, Instagram, and WhatsApp (~6 hours)',
    headline: 'The day the internet forgot where Facebook lived.',
    story:
      'During routine maintenance on the private cables linking Facebook\'s buildings, a command accidentally disconnected them all. A built-in safety rule noticed the disconnect and automatically erased Facebook\'s street addresses from the internet\'s directory. Even employees were locked out of internal tools and building badges.',
    after:
      'Engineers had to physically drive to data centers to reset routers by hand, then built separate emergency tools that can\'t be locked out by the main network.',
    analogy:
      'Every store in a nationwide chain still had power and open registers—but an automated crew accidentally took down every highway sign and erased the stores from every GPS on Earth.',
    technical:
      'A backbone capacity audit command severed Meta\'s global backbone. Authoritative DNS servers withdrew BGP route announcements as a self-protection mechanism, making Meta\'s domains unresolvable globally.',
    stageTitle: 'Healthy buildings, missing map',
    prompt: 'Tap "Erase directory" to see why Facebook went dark even though its servers stayed powered on.',
    sources: [
      {
        label: 'Engineering at Meta · Official Postmortem',
        url: 'https://engineering.fb.com/2021/10/05/networking-traffic/outage-details/'
      },
      {
        label: 'Cloudflare · How Facebook Disappeared',
        url: 'https://blog.cloudflare.com/october-2021-facebook-outage/'
      }
    ]
  },
  {
    id: 'gcp',
    tab: 'Google Cloud',
    date: 'June 12, 2025',
    impactLine: '50+ cloud services · Spotify, Fitbit, Discord, and more (~3 hours)',
    headline: 'A blank form jammed the shared front desk.',
    story:
      'Google Cloud uses one central front-desk system to check permissions on almost every request. When an automated update accidentally sent a blank field to that front desk, a hidden bug made it crash repeatedly everywhere at once—stalling dozens of familiar apps.',
    after:
      'Engineers hit an emergency bypass switch to restore service within three hours, then added strict blank-field checks and city-by-city rollout safeguards.',
    analogy:
      'Like fifty healthy stores inside a shopping mall sharing one central ID scanner at the entrance—when a blank card jams every scanner at once, shoppers can\'t enter any store.',
    technical:
      'An automated quota policy update with blank fields replicated globally and hit an unguarded null-pointer code path in Google Cloud Service Control, triggering a global crash loop from 10:45 to 13:45 PDT.',
    stageTitle: 'One shared front desk',
    prompt: 'Tap "Send blank form" to watch one shared check-in jam dozens of healthy apps, then hit "Emergency bypass."',
    sources: [
      {
        label: 'Google Cloud · Official Incident Report',
        url: 'https://status.cloud.google.com/incidents/ow5i3PPK96RduMcb1SsW'
      },
      {
        label: 'Cloudflare · Downstream Impact Report',
        url: 'https://blog.cloudflare.com/cloudflare-service-outage-june-12-2025/'
      },
      {
        label: 'ThousandEyes · Outage Analysis',
        url: 'https://www.thousandeyes.com/blog/google-cloud-outage-analysis-june-12-2025'
      }
    ]
  },
  {
    id: 'cloudflare',
    tab: 'Cloudflare',
    date: 'November 18, 2025',
    impactLine: 'Major websites and online apps worldwide (~3 hours primary)',
    headline: 'A guest list doubled in size and jammed the front gate.',
    story:
      'Cloudflare acts like a fast front gate protecting a huge portion of the web from spam bots. A routine internal database tweak accidentally doubled the size of its automated bot list. When that oversized list hit front-gate servers worldwide, it tripped an internal size limit and crashed the gate.',
    after:
      'Engineers swapped back to the previous list and changed their rules so internal files now go through the same size checks and wave rollouts as outside data.',
    analogy:
      'Like updating the guest binder at thousands of theaters at once—except a copy glitch prints every name twice, making the binder too thick to fit in the ticket scanner.',
    technical:
      'A ClickHouse permissions change produced duplicate rows in a Bot Management feature file generated every 5 minutes, exceeding a hard-coded maximum feature limit in Cloudflare\'s core proxy software.',
    stageTitle: 'Overflowing a hidden size limit',
    prompt: 'Drag the guest-list size past the limit—or tap "Double the list"—to see when the front gate trips.',
    sources: [
      {
        label: 'Cloudflare · Official November 18 Postmortem',
        url: 'https://blog.cloudflare.com/18-november-2025-outage/'
      }
    ]
  },
  {
    id: 'fastly',
    tab: 'Fastly',
    date: 'June 8, 2021',
    impactLine: 'Amazon, Reddit, New York Times, CNN, GOV.UK (49 minutes)',
    headline: 'One normal setting flipped a hidden switch across the web.',
    story:
      'Fastly runs a giant delivery network that helps major news sites and stores load quickly. A hidden software quirk had been sitting dormant in its code for weeks. When a single customer saved a completely ordinary settings change, it tripped that hidden switch across 85% of Fastly\'s network.',
    after:
      'Engineers spotted the outage in under 60 seconds and had 95% of the network back online within 49 minutes—a textbook example of fast recovery.',
    analogy:
      'Like elevators across 100 skyscrapers sharing a hidden wiring quirk—until one tenant presses floors 4 and 9 in a normal sequence and pauses elevators across the city.',
    technical:
      'A latent software bug introduced in a May 12 release was triggered by a valid customer VCL configuration change, returning 503 errors across ~85% of Fastly\'s global POPs until isolated and disabled in 49 minutes.',
    stageTitle: 'Dormant bug, 49-minute recovery',
    prompt: 'Step through the three moments: Normal traffic → Normal setting flips the hidden switch → Caught & restored.',
    sources: [
      {
        label: 'Fastly · Summary of June 8 Outage',
        url: 'https://www.fastly.com/blog/summary-of-june-8-outage'
      },
      {
        label: 'ThousandEyes · Inside the Fastly Outage',
        url: 'https://www.thousandeyes.com/blog/inside-the-fastly-outage-analysis-and-lessons-learned'
      }
    ]
  }
];

export const FALLBACK_LIVE_STATUS = {
  updatedAt: '2026-11-24T16:45:00.000Z',
  overall: 'quiet',
  providers: [
    { id: 'gcp', name: 'Google Cloud', status: 'operational', statusUrl: 'https://status.cloud.google.com/' },
    { id: 'aws', name: 'Amazon AWS', status: 'operational', statusUrl: 'https://health.aws.amazon.com/' },
    { id: 'azure', name: 'Microsoft Azure', status: 'operational', statusUrl: 'https://azure.status.microsoft/' },
    { id: 'cloudflare', name: 'Cloudflare', status: 'operational', statusUrl: 'https://www.cloudflarestatus.com/' },
    { id: 'github', name: 'GitHub', status: 'operational', statusUrl: 'https://www.githubstatus.com/' }
  ],
  activeIncidents: [],
  recentIncidents: [
    {
      id: 'ms365-nov-2026',
      date: 'Nov 12–13, 2026',
      who: 'Microsoft 365',
      layer: 'gateway',
      oneLiner: 'Outlook email and Teams stalled worldwide for nearly a full day.',
      whatYouSaw:
        'Work emails wouldn\'t send, Teams chats froze, and logins failed across businesses, hospitals (including UK NHS trusts), and government offices.',
      why: 'A hidden software mistake—sitting quietly since a July update—woke up on Microsoft\'s main network gateways when heavy traffic shifted during lower capacity. Microsoft confirmed it was not a cyberattack.',
      analogy:
        'Like a highway tollbooth lane having a stuck gate all summer that nobody noticed until rush-hour traffic got rerouted through that exact lane.',
      technical:
        'A dormant Windows networking defect on Exchange Online gateway servers triggered under shifted traffic load and reduced capacity, cascading into Outlook, Teams, and Copilot for ~23h 50m.',
      sources: [
        {
          label: 'ThousandEyes · Outage Analysis (Nov 17, 2026)',
          url: 'https://www.thousandeyes.com/blog/microsoft-365-outage-analysis-november-12-2026'
        },
        {
          label: 'The Guardian · Global Coverage',
          url: 'https://www.theguardian.com/technology/2026/nov/13/microsoft-outage-outlook-teams-word-excel-reports'
        }
      ]
    },
    {
      id: 'gcp-london-oct-2026',
      date: 'Oct 19–20, 2026',
      who: 'Google Cloud (London)',
      layer: 'power',
      oneLiner: 'A local power disruption in London slowed UK banking and retail apps for 6 hours.',
      whatYouSaw:
        'Several UK banking apps and websites hosted in London felt sluggish or briefly failed to load overnight and into Tuesday morning.',
      why: 'An outside electrical power interruption struck one London building. Traffic automatically shifted to neighboring London buildings, which briefly caused traffic jams while absorbing the extra crowd.',
      analogy:
        'Like one terminal at a busy airport losing power: flights move to the next terminal so travel keeps going, but security lines get crowded until the lights come back on.',
      technical:
        'An external electrical power disruption impacted Google Cloud zone europe-west2-b; failover traffic created transient latency and elevated errors across europe-west2 for 6 hours and 8 minutes.',
      sources: [
        {
          label: 'Google Cloud · Official Incident Report',
          url: 'https://status.cloud.google.com/incidents/Xs2XTHzAVC9YnafnPyzj'
        }
      ]
    }
  ]
};
