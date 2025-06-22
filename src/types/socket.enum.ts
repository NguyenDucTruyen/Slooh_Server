export enum SocketEvent {
  // Session events
  CREATE_PHIEN = 'phien:create',
  JOIN_PHIEN = 'phien:join',
  LEAVE_PHIEN = 'phien:leave',
  END_PHIEN = 'phien:end',

  // Navigation events
  NAVIGATE = 'phien:navigate',
  NAVIGATED = 'phien:navigated',

  // Question events
  START_QUESTION = 'phien:startQuestion',
  QUESTION_STARTED = 'phien:questionStarted',
  SUBMIT_ANSWER = 'phien:submitAnswer',
  ANSWER_SUBMITTED = 'phien:answerSubmitted',

  // Leaderboard events
  SHOW_LEADERBOARD = 'phien:showLeaderboard',
  LEADERBOARD = 'phien:leaderboard',

  // Member events
  MEMBER_JOINED = 'phien:memberJoined',
  MEMBER_LEFT = 'phien:memberLeft',

  // Status events
  STARTED = 'phien:started',
  ENDED = 'phien:ended',

  // System events
  ERROR = 'error',
  DISCONNECT = 'disconnect'
}