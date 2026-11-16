export function extractFootballRows(payload) {
  const candidates = [
    payload?.matches,
    payload?.events,
    payload?.fixtures,
    payload?.response?.matches,
    payload?.response?.events,
    payload?.response?.fixtures,
    payload?.response?.live,
    payload?.response?.livescore,
    payload?.data?.matches,
    payload?.data?.events,
    payload?.data?.fixtures,
    payload?.result?.matches,
    payload?.result?.events,
    payload?.result?.fixtures,
    payload?.response,
    payload?.data,
    payload?.result,
  ];
  return candidates.find(Array.isArray) || [];
}

function teamName(team) {
  if (typeof team === 'string') return team;
  return team?.name || team?.team_name || team?.teamName || '';
}

export function normalizeFootballMatch(match) {
  const home = match.home_team || match.homeTeam || match.home || match.teams?.home || match.home_name;
  const away = match.away_team || match.awayTeam || match.away || match.teams?.away || match.away_name;
  const homeName = teamName(home);
  const awayName = teamName(away);
  if (!homeName || !awayName) return null;

  const score = match.score || match.goals || {};
  const status = match.status?.short || match.status || match.state || '';
  const normalizedStatus = /live|in.?play|1h|2h|half|ft|finished/i.test(String(status)) ? 'LIVE' : 'UPCOMING';

  return {
    id: String(match.id || match.event_id || match.match_id || match.fixture?.id || `${homeName}-${awayName}`),
    league: match.league?.name || match.league_name || match.league || match.competition?.name || 'Football',
    home_team: typeof home === 'object' ? { ...home, name: homeName } : { name: homeName },
    away_team: typeof away === 'object' ? { ...away, name: awayName } : { name: awayName },
    strHomeTeam: homeName,
    strAwayTeam: awayName,
    score: {
      home: score.home ?? score.home_score ?? match.home_score ?? '-',
      away: score.away ?? score.away_score ?? match.away_score ?? '-',
    },
    status: normalizedStatus,
    time: match.time || match.elapsed || match.kickoff || match.start_time || '',
    dateEvent: match.date || match.event_date || match.start_date || '',
    strTime: match.time || match.elapsed || match.kickoff || match.start_time || '',
  };
}
