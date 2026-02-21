import type { Section } from './types';
import { developerDiscovery } from './developer-discovery';
import { developerDashboard } from './developer-dashboard';
import { developerDeepDive } from './developer-deep-dive';
import { maintainerOnboarding } from './maintainer-onboarding';
import { maintainerDashboardStory } from './maintainer-dashboard';
import { maintainerLifecycle } from './maintainer-lifecycle';
import { enterpriseShield } from './enterprise-shield';
import { enterpriseEcosystem } from './enterprise-ecosystem';
import { adminAccess } from './admin-access';
import { adminOperations } from './admin-operations';

export const sections: Section[] = [
  {
    id: 'developer',
    numeral: 'I',
    title: 'The Developer Experience',
    subtitle: 'From Discovery to Payout',
    accent: '#0274B6',
    icon: '{ }',
    editorial: {
      intro: `Contributors are the scarce resource. In every open source ecosystem, the bottleneck is never a shortage of problems to solve — it's finding competent developers willing to solve them. GitBusters was designed from this first principle: never tax the supply side. A 5% fee on a $500 bounty means the developer sees $475 on competing platforms — and for someone evaluating whether to invest eight hours on an unfamiliar codebase, that psychological discount matters more than the economics suggest. The GitBusters developer experience eliminates this friction entirely. Contributors receive exactly what's advertised. What you see is what you get. Behind the scenes, four AI agents — PRD Writer, Estimator, QA Validator, and Code Reviewer — provide the quality assurance that makes transacting with strangers viable.`,
      pullquote: '"Charge the maintainer a premium on top of the bounty. The contributor gets exactly what\'s advertised. What you see is what you get — and that builds trust at scale."',
    },
    stories: [developerDiscovery, developerDashboard, developerDeepDive],
  },
  {
    id: 'maintainer',
    numeral: 'II',
    title: 'The Maintainer Experience',
    subtitle: 'Automated Trust Infrastructure',
    accent: '#1A6B3C',
    icon: '\u2442',
    editorial: {
      intro: `The bounty lifecycle is, at its core, a trust problem. A maintainer posts a bounty; a stranger claims to have solved it. How does the maintainer know the work is genuine? How does the contributor know the payout will arrive? GitBusters replaces reputation with automated trust infrastructure. When a maintainer creates a bounty, the platform charges a 5% creation premium and locks the full bounty amount in a smart contract escrow. Four AI agents then manage the lifecycle: the PRD Agent generates structured requirements, the Estimator prices complexity, the QA Agent validates correctness, and the Reviewer performs code review against acceptance criteria. The result is that escrow release becomes an objective, auditable event rather than a subjective judgment call.`,
      pullquote: '"GitBusters is not a bounty marketplace. It is an automated trust infrastructure for open source collaboration, with a payment rail attached."',
    },
    stories: [maintainerOnboarding, maintainerDashboardStory, maintainerLifecycle],
  },
  {
    id: 'enterprise',
    numeral: 'III',
    title: 'The Enterprise Experience',
    subtitle: 'Open Source Infrastructure Insurance',
    accent: '#C5922E',
    icon: '\u25A0',
    editorial: {
      intro: `Companies already pay for open source maintenance. They just do it badly. They hire full-time developers to contribute upstream, fund foundations with opaque allocation processes, or — most commonly — do nothing and hope the volunteer maintainer of a critical library doesn't burn out. Bounties are a more efficient mechanism, but only if there is a platform that makes it frictionless for a corporation to distribute funding across the most critical issues affecting their stack. That product is GitBusters Shield — an enterprise program that scans dependency manifests, auto-creates bounties on critical issues, and funds resolutions from a managed pool.`,
      pullquote: '"You don\'t sell bounties to enterprises. You sell them peace of mind that their open source dependency chain is being actively maintained by incentivized contributors."',
      dataCallouts: [
        { label: 'Startup Tier', value: '$500', detail: 'per month — up to 50 dependencies' },
        { label: 'Growth Tier', value: '$2K', detail: 'per month — unlimited dependencies' },
        { label: 'Enterprise Tier', value: 'Custom', detail: 'SLA-backed, dedicated agents' },
      ],
    },
    stories: [enterpriseShield, enterpriseEcosystem],
  },
  {
    id: 'admin',
    numeral: 'IV',
    title: 'Platform Administration',
    subtitle: 'Governance & Operational Transparency',
    accent: '#9E1B1D',
    icon: '\u2699',
    editorial: {
      intro: `Governance in a decentralized system requires radical transparency paired with strict access control. The GitBusters admin dashboard embodies this principle: every metric, every bounty, every payout is visible to platform operators — but only those operators whose wallet address matches the deployer can see the full picture. The access control model is wallet-gated, not role-based. There are no usernames, no password resets, no session tokens to compromise. Either your Ethereum address is the deployer address, or you see an access denied screen. This is cryptographic authorization — the same mechanism that secures the escrow contracts also secures the admin dashboard.`,
      pullquote: '"Either your Ethereum address is the deployer address, or you see access denied. This is cryptographic authorization — the same mechanism that secures the escrow also secures the admin dashboard."',
    },
    stories: [adminAccess, adminOperations],
  },
];
