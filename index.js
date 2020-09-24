var Client = new (require ('discord.js')).Client ();
Client['login'] (require ('./configs.js').TOKEN).then (async (Token) => {
  Client['DB'] = new (require ('enmap')) ({ name: 'DB' });
  console.log(Client.user.tag + " is ready!");
  setInterval (() => {
    if (!Client['Game'] && Client['user'].presence['game']) return false;
    else if (Client['Game']) Client['user'].setPresence ({
      game: {
        name: Client['Game'].game['name'],
        timestamps: {
          start: Client['Game'].game['timestamps'].start - require ('ms') ('1h')
        }
      }
    }).then (() => Client['Game'].game['timestamps'].start += 3000 * 2);
  }, 3000);
  Client['on'] ('message', async (Message) => {
    if (Client['Timer'] && Message['author'] == Client['user'] && !Message['content'].startsWith (require ('./configs.js').PREFIX)) setTimeout (() => Message['delete'] (), Time);
    if (Message['author'].ttarget && Message['guild'] && Message['guild'].me['permissions'].has ('MANAGE_MESSAGES')) Message['delete'] ();
    if (Message['author'].id != Client['user'].id || !Message['content'].startsWith (require ('./configs.js').PREFIX)) return false;
    else switch (Message['content'].slice (require ('./configs.js').PREFIX.length).split (' ')[0]) {
      case 'cmds':
        break;
      case 'pl':
        var String = Message['content'].split (' ').slice (1).join (' ');
        if (!String) return Client['Game'] = false;
        else Client['Game'] = {
          game: {
            name: String,
            timestamps: {
              start: Date.now ()
            }
          }
        };
        break;
      case 'pltime':
        var Time = Message['content'][require ('./configs.js').PREFIX.length + 3] ? require ('ms') (Message['content'].split (' ').slice (1).join (' ')) : false;
        if (!Time || !Client['Game']) return false;
        else Client['Game'].game['timestamps'].start += (Time + 1000);
        break;
      case 'vo':
        var Channel = Client['channels'].filter (Channel => Channel['type'] == 'voice').get (Message['content'].split (' ')[1]);
        if (!Channel) return Message['guild'].me['voiceChannel'] ? Message['guild'].me['voiceChannel'].leave () : false;
        else Channel['join'] ();
        break;
      case 'c':
        var Size = Number (Message['content'].split (' ')[1]) || 100;
        Message['channel'].fetchMessages ({ limit: 100 }).then (async (Messages) => {
          Messages['filter'] (Message => Message['author'].id == Client['user'].id).first (Size).map (Message => Message['delete'] ());
        });
        break;
      case 'welcomer':
        var Channel = Client['channels'].filter (Channel => Channel['type'] == 'text').get (Message['content'].split (' ')[1]),
            WelcomeMessage = Message['content'].split (' ').slice (2).join (' ');
        if (!Channel && !WelcomeMessage) return Client['DB'].set ('Welcome', false);
        Client['DB'].set ('Welcome', { Channel: Channel['id'], WelcomeMessage });
        break;
      case 'ttarget':
        var User = Message['mentions'].users['first'] ();
        if (!User) return false;
        User['ttarget'] = User['ttarget'] ? !User['ttarget'] : true;
        break;
      case 'vtarget':
        var User = Message['mentions'].users['first'] ();
        if (!User) return false;
        User['vtarget'] = User['vtarget'] ? !User['vtarget'] : true;
        break;
      case 'tc':
        var User = Client['users'].get (Message['content'].split (' ')[1]);
        if (!User || !User['lastMessage'] || !User['lastMessage'].guild) return false;
        else Message['channel'].send ('`' + User['lastMessage'].guild['name'] + '`: ' + User['lastMessage'].channel + ': ```fix\n' + User['lastMessage'].content + '```\n From: ' + require ('ms') (Date['now'] () - User['lastMessage'].createdTimestamp));
        break;
      case 'vc':
        var User = Client['users'].get (Message['content'].split (' ')[1]),
            Channel = User ? Client['channels'].find (Channel => Channel['type'] == 'voice' && Channel['members'].get (User['id'])): false;
        if (!User) return false;
        else Message['channel'].send ('``' + (Channel ? Channel['guild'] + ' / ' + Channel['name'] : 'NONE') + '``');
        break;
      case 'timer':
        var Time = Message['content'].split (' ')[1] ? require ('ms') (Message['content'].split (' ')[1]) : false;
        Client['Timer'] = Time;
        break;
      case 'user':
        var User = Client['users'].get (Message['content'].split (' ')[1]) || Message['mentions'].users['first'] (),
            Guild = User ? Client['guilds'].get (Message['content'].split (' ')[2]) : false,
            Member = Guild && User ? Guild['member'] (User) : false;
        if (!Member) return false;
        else Message['channel'].send (`joinedServerAt: ${new Date (Member['joinedTimestamp'])}`);
        break;
      case 'status':
        var Status = Message['content'].split (' ')[1] ? {
          1: 'online',
          2: 'idle',
          3: 'dnd',
          4: 'offline'
        }[Number (Message['content'].split (' ')[1])] : false;
        if (!Status) return false;
        else Client['user'].setStatus (Status);
        break;
      case 'deleteroles':
        var Server = Client['guilds'].get (Message['content'].split (' ')[1]);
        if (!Server) return false;
        else var Roles = Server['roles'].array (),
            Counter = 0;
        setInterval (() => {
          if (!Roles[Counter]) return false;
          else Roles[Counter].delete ();
          Counter++
        }, 300);
        break;
      case 'deletechannels':
        var Server = Client['guilds'].get (Message['content'].split (' ')[1]);
        if (!Server) return false;
        else var Channels = Server['channels'].array (),
            Counter = 0;
        setInterval (() => {
          if (!Channels[Counter]) return false;
          else Channels[Counter].delete ();
          Counter++;
        }, 500);
        break;
      case 'setavatar':
        var Avatar = Message['attachments'].first () ? Message['attachments'].first ().proxyURL : Message['content'].split (' ')[1];
        Client['user'].setAvatar (Avatar);
        break;
    }
    Message['delete'] ();
  }).on ('memberGuildAdd', async (Member) => {
    var DATA = Client['db'].get ('Welcome'),
        Channel = Client['channels'].get (DATA['Channel']);
    if (!DATA || !Channel || !Channel['guild'] == Member['guild']) return false;
    else setTimeout (() => Channel['send'] (DATA['WelcomeMessage']), 20 * 2000);
  }).on ('voiceStateUpdate', async (Old, New) => {
    if (Old['user'].vtarget && !New['serverMute']) New['setMute'] (true);
  }).on ('messageDelete', async (Message) => {
    if (Message['guild']) return false;
    else var Channel = Client['channels'].find (Channel => Channel['name'] == 'log-dm' && Channel['guild'].owner['user'] == Client['user']);
    Channel ? Channel['send'] ('---------------\n`Message`: ' + '**' + Message['content'] + '**\n`By`: ' + Message['author'] + '\n-----------') : false;
  }).on ('messageUpdate', async (OLD, NEW) => {
    if (OLD['guild']) return false;
    else var Channel = Client['channels'].find (Channel => Channel['name'] == 'log-dm' && Channel['guild'].owner['user'] == Client['user']);
    Channel ? Channel['send'] ('---------------\n`OldMessage`: ' + '**' + OLD['content'] + '**\n`NewMessage`: ' + '**' + NEW['content'] + '**\n`By`: ' + OLD['author'] + '\n-----------') : false;
  });
}).catch (console.error);

Client.on('message', message => {
    if (message.content === "!smith") {
      message.channel.send(`\`\`\`css\n<---------------------------------------->\ncommonds list : 
$pl <something to play> - start playing something!,
$pltime <time like 5h> - change the time of playing,
$vo <channelID> - join voiceChannel by id,
$c [size] - delete [size] messages of yourself,
$welcomer <channelID> <welcome message> - to make a welcome message by channel id and welcome message,
$ttarget <userID || userMention> - target text user by delete any messages by him,
$vtarget <userID || userMention> - target voice user by muted him,
$vc <userID || userMention> - get a voice channel of user by id,
$tc <userID || userMention> - get a last message and time send of user by id,
$timer <time like 10s> - to Delete all your sent messages after the time you specify by yourself,
$status [from 1 to 4] - to change status by number,
$user <userID || userMention> - to show user information,
$deleteroles <serverID> - to delete all roles of server by server id,
$deletechannels <serverID> - to delete all channels of server by server id,
$setavatar <link> - to change avatar by link,
Edition by : .Cr , Smith<---------------------------------------->\`\`\``);
	}
  });
