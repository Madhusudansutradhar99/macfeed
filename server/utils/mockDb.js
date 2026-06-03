const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '../.db');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function readData(modelName) {
  const file = path.join(DB_DIR, `${modelName.toLowerCase()}s.json`);
  if (!fs.existsSync(file)) {
    // Seed default apps if it's the App model and empty
    if (modelName === 'App') {
      const defaultApps = [
        {
          _id: 'app-macfeed-pro',
          name: 'MacFeed Pro Streamer',
          playStoreLink: 'https://play.google.com/store/apps/details?id=com.macfeed.pro',
          icon: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=128&h=128&fit=crop',
          rewardAmount: 25,
          instructions: 'Install MacFeed Pro Streamer, log in using your Google account, browse movies for 5 minutes, and leave a detailed 5-star review with a screenshot on the Play Store.',
          totalReviews: 12,
          isActive: true,
          targetType: 'group',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'app-macfeed-music',
          name: 'MacFeed Retro Music',
          playStoreLink: 'https://play.google.com/store/apps/details?id=com.macfeed.music',
          icon: 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=128&h=128&fit=crop',
          rewardAmount: 15,
          instructions: 'Download the app, play at least 3 retro radio stations, and leave a review explaining your experience. Upload screenshot of your review for confirmation.',
          totalReviews: 8,
          isActive: true,
          targetType: 'group',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          _id: 'app-macfeed-kids',
          name: 'MacFeed Kids Cartoons',
          playStoreLink: 'https://play.google.com/store/apps/details?id=com.macfeed.kids',
          icon: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=128&h=128&fit=crop',
          rewardAmount: 10,
          instructions: 'Install and test child filters in the settings. Provide feedback on ease of use. Upload proof of Google Play review submission.',
          totalReviews: 4,
          isActive: true,
          targetType: 'group',
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      fs.writeFileSync(file, JSON.stringify(defaultApps, null, 2));
      return defaultApps;
    }
    
    // Seed default users if it's the User model and empty
    if (modelName === 'User') {
      const bcrypt = require('bcryptjs');
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('secret123', salt);
      const defaultUsers = [
        {
          _id: 'user-admin',
          name: 'MacFeed Admin',
          email: 'admin@macfeed.com',
          password: hashedPassword,
          role: 'admin',
          phone: '+919999999999',
          totalEarnings: 10000,
          pendingAmount: 2500,
          withdrawnAmount: 7500,
          createdAt: new Date().toISOString()
        },
        {
          _id: 'user-support',
          name: 'Support Agent',
          email: 'support@macfeed.com',
          password: hashedPassword,
          role: 'admin',
          phone: '+918888888888',
          totalEarnings: 0,
          pendingAmount: 0,
          withdrawnAmount: 0,
          createdAt: new Date().toISOString()
        },
        {
          _id: 'user-tester',
          name: 'Beta Tester',
          email: 'tester@macfeed.com',
          password: hashedPassword,
          role: 'user',
          phone: '+917777777777',
          totalEarnings: 150,
          pendingAmount: 50,
          withdrawnAmount: 100,
          createdAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(file, JSON.stringify(defaultUsers, null, 2));
      return defaultUsers;
    }

    // Seed default chats if it's the Chat model and empty
    if (modelName === 'Chat') {
      const defaultChats = [
        {
          _id: 'chat-support-1',
          chatName: 'Support Chat',
          isGroupChat: false,
          users: ['user-admin', 'user-tester'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(file, JSON.stringify(defaultChats, null, 2));
      return defaultChats;
    }

    // Seed default messages if it's the Message model and empty
    if (modelName === 'Message') {
      const defaultMessages = [
        {
          _id: 'msg-seed-1',
          chat: 'chat-support-1',
          senderId: 'user-tester',
          content: 'Hello, MacFeed Support! I need some help with my reviews.',
          isRead: true,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          _id: 'msg-seed-2',
          chat: 'chat-support-1',
          senderId: 'user-admin',
          content: 'Hello! Welcome to MacFeed Help Desk. How can I assist you today?',
          isRead: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(file, JSON.stringify(defaultMessages, null, 2));
      return defaultMessages;
    }
    
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeData(modelName, data) {
  const file = path.join(DB_DIR, `${modelName.toLowerCase()}s.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function matches(item, query) {
  if (!query) return true;
  for (const key of Object.keys(query)) {
    if (key === '$or') {
      const conditions = query[key];
      if (!Array.isArray(conditions) || !conditions.some(cond => matches(item, cond))) {
        return false;
      }
    } else if (key === '$and') {
      const conditions = query[key];
      if (!Array.isArray(conditions) || !conditions.every(cond => matches(item, cond))) {
        return false;
      }
    } else {
      const val = query[key];
      const itemVal = item[key];
      
      // Handle operators on the value
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if ('$ne' in val) {
          const neVal = val.$ne;
          const left = itemVal ? itemVal.toString() : '';
          const right = neVal ? neVal.toString() : '';
          if (left === right) return false;
        } else if ('$elemMatch' in val) {
          const elemMatch = val.$elemMatch;
          if (!Array.isArray(itemVal)) return false;
          
          if ('$eq' in elemMatch) {
            const eqVal = elemMatch.$eq;
            const match = itemVal.some(el => el && el.toString() === eqVal.toString());
            if (!match) return false;
          } else {
            const match = itemVal.some(el => matches(el, elemMatch));
            if (!match) return false;
          }
        } else {
          const left = itemVal ? itemVal.toString() : '';
          const right = val._id ? val._id.toString() : val.toString();
          if (left !== right) return false;
        }
      } else {
        let left = (itemVal === undefined || itemVal === null) ? '' : itemVal.toString();
        let right = (val === undefined || val === null) ? '' : val.toString();
        
        // Treat undefined/null/'' as equivalent to 'false' if comparing with boolean false
        if (right === 'false') {
          if (left === '') left = 'false';
        }
        if (left !== right) return false;
      }
    }
  }
  return true;
}

class MockDocument {
  constructor(modelName, data) {
    this._modelName = modelName;
    Object.assign(this, data);
    if (!this._id) {
      this._id = Math.random().toString(36).substring(2, 9);
    }
  }

  async save() {
    return saveDocument(this._modelName, this);
  }

  async populate(path, select) {
    if (path === 'senderId') {
      const users = readData('User');
      const uObj = users.find(u => u._id === this.senderId?.toString());
      if (uObj) {
        this.senderId = { _id: uObj._id, name: uObj.name, email: uObj.email };
      }
    } else if (path === 'chat') {
      const chats = readData('Chat');
      const cObj = chats.find(c => c._id === this.chat?.toString());
      if (cObj) {
        this.chat = { ...cObj };
      }
    }
    return this;
  }
}

class MockQuery {
  constructor(modelName, items, isSingle = false) {
    this._modelName = modelName;
    this._items = items;
    this._isSingle = isSingle;
  }

  sort(sortStr) {
    // If it's sorting by updatedAt or similar
    this._items.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
    return this;
  }

  select(selectStr) {
    return this;
  }

  populate(path, select) {
    if (path === 'targetUser' || path === 'createdBy' || path === 'groupAdmin') {
      const users = readData('User');
      this._items = this._items.map(item => {
        const userId = item[path];
        if (userId) {
          const userObj = users.find(u => u._id === userId.toString());
          if (userObj) {
            item[path] = { _id: userObj._id, name: userObj.name, email: userObj.email };
          }
        }
        return item;
      });
    } else if (path === 'users') {
      const users = readData('User');
      this._items = this._items.map(item => {
        if (Array.isArray(item.users)) {
          item.users = item.users.map(uId => {
            const uObj = users.find(u => u._id === uId.toString());
            return uObj ? { _id: uObj._id, name: uObj.name, email: uObj.email, role: uObj.role } : uId;
          });
        }
        return item;
      });
    } else if (path === 'latestMessage') {
      const messages = readData('Message');
      this._items = this._items.map(item => {
        if (item.latestMessage) {
          const mObj = messages.find(m => m._id === item.latestMessage.toString());
          if (mObj) {
            item.latestMessage = { ...mObj };
          }
        }
        return item;
      });
    } else if (path === 'appId') {
      const apps = readData('App');
      this._items = this._items.map(item => {
        if (item.appId) {
          const appObj = apps.find(a => a._id === item.appId.toString());
          if (appObj) {
            item.appId = { ...appObj };
          }
        }
        return item;
      });
    } else if (path === 'appTaskId') {
      const apps = readData('App');
      this._items = this._items.map(item => {
        if (item.appTaskId) {
          const appObj = apps.find(a => a._id === item.appTaskId.toString());
          if (appObj) {
            item.appTaskId = { ...appObj };
          }
        }
        return item;
      });
    }
    return this;
  }

  limit(n) {
    this._items = this._items.slice(0, n);
    return this;
  }

  then(resolve, reject) {
    if (this._isSingle) {
      const item = this._items[0];
      resolve(item ? new MockDocument(this._modelName, item) : null);
    } else {
      const docs = this._items.map(item => new MockDocument(this._modelName, item));
      resolve(docs);
    }
  }
}

class MockModel {
  constructor(modelName) {
    this.modelName = modelName;
  }

  find(query = {}) {
    const items = readData(this.modelName);
    const filtered = items.filter(item => matches(item, query));
    return new MockQuery(this.modelName, filtered, false);
  }

  findOne(query = {}) {
    const items = readData(this.modelName);
    const item = items.find(item => matches(item, query));
    return new MockQuery(this.modelName, item ? [item] : [], true);
  }

  findById(id) {
    return this.findOne({ _id: id });
  }

  async create(data) {
    const items = readData(this.modelName);
    const defaults = {};
    if (this.modelName === 'Message') {
      defaults.isRead = false;
    } else if (this.modelName === 'Chat') {
      defaults.isGroupChat = false;
      defaults.users = [];
    } else if (this.modelName === 'App') {
      defaults.isActive = true;
      defaults.totalReviews = 0;
    }
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...defaults,
      ...data
    };
    items.push(newDoc);
    writeData(this.modelName, items);
    return new MockDocument(this.modelName, newDoc);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const items = readData(this.modelName);
    const idx = items.findIndex(item => item._id === id);
    if (idx === -1) return null;
    
    // Handle mongoose update operators if any ($set etc.)
    const rawUpdate = update.$set ? { ...update, ...update.$set } : update;
    delete rawUpdate.$set;

    const updated = {
      ...items[idx],
      ...rawUpdate,
      updatedAt: new Date().toISOString()
    };
    items[idx] = updated;
    writeData(this.modelName, items);
    return new MockDocument(this.modelName, updated);
  }

  async updateMany(query, update, options = {}) {
    const items = readData(this.modelName);
    let updatedCount = 0;
    
    // Handle mongoose update operators if any ($set etc.)
    const rawUpdate = update.$set ? { ...update, ...update.$set } : update;
    delete rawUpdate.$set;

    const updatedItems = items.map(item => {
      if (matches(item, query)) {
        updatedCount++;
        return {
          ...item,
          ...rawUpdate,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    if (updatedCount > 0) {
      writeData(this.modelName, updatedItems);
    }
    return { nModified: updatedCount, n: updatedCount };
  }

  async populate(docs, options) {
    if (!docs) return docs;
    const isArray = Array.isArray(docs);
    const docList = isArray ? docs : [docs];
    
    const path = options.path;
    if (path === 'latestMessage.senderId') {
      const users = readData('User');
      const messages = readData('Message');
      
      for (const doc of docList) {
        if (doc.latestMessage) {
          let msgObj = doc.latestMessage;
          if (typeof msgObj === 'string') {
            msgObj = messages.find(m => m._id === msgObj);
            if (msgObj) doc.latestMessage = { ...msgObj };
          }
          if (doc.latestMessage && doc.latestMessage.senderId) {
            const senderId = doc.latestMessage.senderId;
            const senderIdStr = (senderId && typeof senderId === 'object') ? (senderId._id || '') : senderId;
            const userObj = users.find(u => u._id === senderIdStr.toString());
            if (userObj) {
              doc.latestMessage.senderId = { _id: userObj._id, name: userObj.name, email: userObj.email };
            }
          }
        }
      }
    } else if (path === 'chat.users') {
      const chats = readData('Chat');
      const users = readData('User');
      for (const doc of docList) {
        if (doc.chat) {
          let chatObj = doc.chat;
          if (typeof chatObj === 'string') {
            chatObj = chats.find(c => c._id === chatObj);
            if (chatObj) doc.chat = { ...chatObj };
          }
          if (doc.chat && Array.isArray(doc.chat.users)) {
            doc.chat.users = doc.chat.users.map(uId => {
              const uObj = users.find(u => u._id === uId.toString());
              return uObj ? { _id: uObj._id, name: uObj.name, email: uObj.email } : uId;
            });
          }
        }
      }
    }
    
    return isArray ? docList : docList[0];
  }
}

function saveDocument(modelName, doc) {
  const items = readData(modelName);
  const data = { ...doc };
  delete data._modelName;
  
  const idx = items.findIndex(item => item._id === data._id);
  if (idx !== -1) {
    items[idx] = {
      ...items[idx],
      ...data,
      updatedAt: new Date().toISOString()
    };
  } else {
    items.push(data);
  }
  writeData(modelName, items);
  return new MockDocument(modelName, data);
}

module.exports = {
  model: (modelName) => new MockModel(modelName),
  readData,
  saveDocument
};
