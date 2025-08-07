import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import ReactMarkdown from 'react-markdown';

const EMBED_ID = '36de82b2-0339-4ba5-ae00-bc19bb5d294a';
const SESSION_COOKIE_KEY = `allm_${EMBED_ID}_session_id`;
const CHAT_STREAM_ENDPOINT = `https://chat.app.securedsoft.net/api/embed/${EMBED_ID}/stream-chat`;
const CHAT_HISTORY_ENDPOINT = `https://chat.app.securedsoft.net/api/embed/${EMBED_ID}`;

const ChatApp = () => {
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const eventSourceRef = useRef(null);
  const [isNewSession, setIsNewSession] = useState(false);
  const chatWindowRef = useRef(null);
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem('chatWidgetOpen');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('chatWidgetOpen', isOpen);
  }, [isOpen]);

  useEffect(() => {
    let existingSessionId = Cookies.get(SESSION_COOKIE_KEY);
    if (existingSessionId) {
      setSessionId(existingSessionId);
      setIsNewSession(false);
    } else {
      const newSessionId = uuidv4();
      Cookies.set(SESSION_COOKIE_KEY, newSessionId, { expires: 7 });
      setSessionId(newSessionId);
      setIsNewSession(true);
    }
  }, []);

  useEffect(() => {
    if (sessionId && !isNewSession) {
      loadChatHistory();
    }
  }, [sessionId, isNewSession]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [chatLog]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setIsBotLoading(true);

    const payload = {
      message,
      sessionId,
      username: null,
      prompt: null,
      model: null,
      temperature: null,
    };

    setChatLog((prev) => [...prev, { type: 'user', text: message }]);
    setMessage('');

    const response = await fetch(CHAT_STREAM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let botMsg = '';
    let botMsgStarted = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.startsWith('data:'));

      lines.forEach(line => {
        const data = JSON.parse(line.replace('data: ', ''));
        if (data.type === 'textResponseChunk' && data.textResponse) {
          botMsg += data.textResponse;
          if (!botMsgStarted) {
            // Add a placeholder for the bot message
            setChatLog((prev) => [...prev, { type: 'bot', text: botMsg }]);
            botMsgStarted = true;
          } else {
            // Update the last bot message
            setChatLog((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { type: 'bot', text: botMsg };
              return updated;
            });
          }
        }
      });
    }
    setIsBotLoading(false);
  };

  const loadChatHistory = async () => {
    console.log('loading chat history');
    try {
      const res = await axios.get(`${CHAT_HISTORY_ENDPOINT}/${sessionId}`);
      console.log(res.data);
      // Handle new response format: { history: [...] }
      let historyArr = Array.isArray(res.data) ? res.data : res.data.history;
      if (Array.isArray(historyArr)) {
        const history = historyArr.map(item => {
          if (item.role === 'user') {
            return { type: 'user', text: item.content };
          } else if (item.role === 'assistant' || item.type === 'query') {
            return { type: 'bot', text: item.content };
          } else {
            return null;
          }
        }).filter(Boolean);
        setChatLog(history);
      }
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 9999,
            border: 'none',
            borderRadius: '50%',
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <svg width="342" height="436" viewBox="0 0 342 436" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_423_52)">
<path d="M275.82 236.341C296.89 260.621 293.28 297.931 285.91 317.801C277.68 339.991 248.58 366.431 205.97 360.061C163.34 353.671 155.41 353.491 136.59 358.901C50.9702 383.551 18.4402 279.061 58.1102 236.971C121.52 169.651 234.6 188.871 275.82 236.351V236.341Z" fill="white"/>
<path d="M317.99 228.14V228.16C327.01 244.94 331.99 263.49 331.99 282.99C331.99 358.28 257.67 419.31 166.01 419.31C74.3498 419.31 0.00976562 358.27 0.00976562 282.99C0.00976562 207.71 74.3298 146.67 166.01 146.67C233.92 146.67 292.3 180.18 317.99 228.15V228.14ZM285.91 317.8C293.28 297.93 296.89 260.62 275.82 236.34C234.6 188.87 121.52 169.64 58.1098 236.96C18.4398 279.06 50.9697 383.55 136.59 358.89C155.41 353.48 163.33 353.66 205.97 360.05C248.58 366.42 277.68 339.98 285.91 317.79V317.8Z" fill="white"/>
<path d="M184.31 9.33989V26.4399L184.2 28.0999L158.76 26.4599C152.92 26.0899 148.14 29.9399 148.14 35.0799V91.7799L110.1 90.4099L84.78 113.3L90.08 89.6999L66.85 88.8799C62.35 88.7199 58.73 84.9899 58.73 80.5399V16.1799C58.73 11.7299 62.35 7.8999 66.85 7.6099L173.68 0.719896C179.52 0.349896 184.3 4.19989 184.3 9.33989H184.31Z" fill="#0F2A40"/>
<path d="M273.71 41.8994V106.279C273.71 110.709 270.09 114.439 265.59 114.599L242.36 115.439L247.66 139.039L222.34 116.149L158.75 118.419C152.91 118.629 148.13 114.639 148.13 109.489V35.0794C148.13 29.9394 152.91 26.0794 158.75 26.4594L184.19 28.0994L265.58 33.3294C270.08 33.6294 273.7 37.4494 273.7 41.8994H273.71Z" fill="#0F2A40"/>
<path d="M317.99 228.16C327.01 244.94 331.99 263.49 331.99 282.99C331.99 358.28 257.67 419.31 166.01 419.31C74.3498 419.31 0.00976562 358.27 0.00976562 282.99C0.00976562 207.71 74.3298 146.67 166.01 146.67C233.92 146.67 292.3 180.18 317.99 228.15" fill="#5A78FE"/>
<path d="M180.9 51.1094L247.01 53.9194" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M180.9 69.2891L247.01 70.8791" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M180.9 87.459L212.57 87.639" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M125.41 34.1699L78.3696 36.9699" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M107.51 52.9492L78.3696 53.9192" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M313.49 142.92C322.6 142.92 329.98 150.52 329.98 159.91C329.98 169.3 322.61 176.88 313.49 176.88C304.37 176.88 297 169.28 297 159.91C297 150.54 304.39 142.92 313.49 142.92Z" fill="#5A77FA"/>
<path d="M273.16 315.789C279.7 297.619 282.9 263.479 264.2 241.269C227.61 197.849 127.19 180.259 70.8799 241.839C35.6599 280.339 64.5299 375.919 140.57 353.369C157.28 348.409 164.33 348.589 202.17 354.429C240.01 360.269 265.86 336.079 273.16 315.789Z" fill="#5A78FE"/>
<path d="M266.74 249.81C285.44 272.02 282.24 306.16 275.7 324.33C268.4 344.63 242.55 368.82 204.71 362.97C166.87 357.13 159.82 356.95 143.11 361.91C67.0797 384.47 38.2097 288.89 73.4197 250.38C129.73 188.8 230.15 206.38 266.74 249.81Z" fill="#3661D8"/>
<path d="M264.2 241.271C282.9 263.48 279.7 297.621 273.16 315.791C265.86 336.091 240.01 360.281 202.17 354.431C164.33 348.591 157.28 348.411 140.57 353.371C64.5396 375.931 35.6696 280.351 70.8796 241.841C127.19 180.261 227.61 197.84 264.2 241.271Z" fill="#EDEDEF"/>
<path d="M16.8499 142.92C25.9599 142.92 33.3399 150.52 33.3399 159.91C33.3399 169.3 25.9699 176.88 16.8499 176.88C7.72986 176.88 0.359863 169.28 0.359863 159.91C0.359863 150.54 7.72986 142.92 16.8499 142.92ZM314.24 243.77C312.12 243.77 310.41 242.07 310.41 239.95V176.88C310.41 174.76 312.13 173.05 314.24 173.05C316.35 173.05 318.07 174.77 318.07 176.88V239.92C318.07 242.04 316.35 243.77 314.24 243.77Z" fill="#5A77FA"/>
<path d="M17.6 247.881C15.48 247.881 13.77 246.161 13.77 244.051V176.891C13.77 174.771 15.49 173.061 17.6 173.061C19.71 173.061 21.43 174.781 21.43 176.891V244.051C21.43 246.171 19.71 247.881 17.6 247.881Z" fill="#5A77FA"/>
<path d="M165.68 330.031C153.65 330.031 142.66 323.771 136.28 313.281C135.18 311.471 135.76 309.111 137.56 308.011C139.37 306.911 141.73 307.491 142.83 309.291C147.8 317.471 156.34 322.351 165.68 322.351C175.02 322.351 184.19 317.031 189 308.461C190.04 306.611 192.37 305.961 194.22 306.991C196.07 308.031 196.72 310.361 195.69 312.211C189.53 323.191 178.03 330.011 165.69 330.011L165.68 330.031ZM98.1698 280.561C96.0498 280.561 94.3398 278.841 94.3398 276.731C94.3398 265.061 103.61 255.561 115.01 255.561C121.35 255.561 127.24 258.461 131.17 263.531C132.47 265.201 132.16 267.611 130.49 268.911C128.82 270.211 126.41 269.901 125.11 268.231C122.64 265.051 118.96 263.231 115.01 263.231C107.84 263.231 102.01 269.291 102.01 276.741C102.01 278.861 100.29 280.571 98.1798 280.571L98.1698 280.561ZM232.52 280.561C230.4 280.561 228.69 278.841 228.69 276.731C228.69 269.281 222.86 263.221 215.69 263.221C211.74 263.221 208.06 265.041 205.59 268.221C204.29 269.891 201.88 270.191 200.21 268.901C198.54 267.601 198.23 265.191 199.53 263.521C203.46 258.461 209.35 255.551 215.69 255.551C227.09 255.551 236.36 265.051 236.36 276.721C236.36 278.841 234.64 280.551 232.53 280.551L232.52 280.561Z" fill="black"/>
<path d="M318.07 218.61V237.54C316.89 234.82 315.61 232.14 314.24 229.5C313.03 227.18 311.76 224.9 310.41 222.65V207.18C313.17 210.88 315.73 214.69 318.08 218.61H318.07ZM21.44 209.17V225.11C18.51 230.25 15.94 235.56 13.77 241.04V221.09C16.11 217.01 18.67 213.03 21.44 209.17Z" fill="#3661D8"/>
<path d="M184.31 20.589V26.439L184.21 28.099L158.77 26.459C152.93 26.079 148.14 29.939 148.14 35.079V91.779L138.92 91.449V26.969C138.92 21.819 143.71 17.969 149.55 18.339L174.99 19.989L184.31 20.589Z" fill="black"/>
</g>
<defs>
<filter id="filter0_d_423_52" x="0.00976562" y="0.695312" width="341.98" height="434.615" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dx="6" dy="12"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_423_52"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_423_52" result="shape"/>
</filter>
</defs>
</svg>




        </button>
      )}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            borderRadius: 16,
            background: '#fff',
            width: '30vw',
            minWidth: 320,
            maxWidth: 800
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', padding: '12px 20px 8px 16px', borderTopLeftRadius: 16, borderTopRightRadius: 16, background: '#f1f5f9' }}>
            <h2 style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              margin: 0,
              color: '#2563eb',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyItems: 'center',
              gap: 8
            }}>
              
              <svg width="32" height="32" viewBox="0 0 342 293" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_424_57)">
<path d="M275.811 93.6455C296.881 117.925 293.271 155.235 285.901 175.105C277.671 197.295 248.571 223.735 205.961 217.365C163.331 210.975 155.401 210.795 136.581 216.205C50.9609 240.855 18.4309 136.365 58.1009 94.2755C121.511 26.9555 234.591 46.1755 275.811 93.6555V93.6455Z" fill="white"/>
<path d="M317.98 85.4446V85.4646C327 102.245 331.98 120.795 331.98 140.295C331.98 215.585 257.66 276.615 166 276.615C74.34 276.615 0 215.575 0 140.295C0 65.0146 74.32 3.97461 166 3.97461C233.91 3.97461 292.29 37.4846 317.98 85.4546V85.4446ZM285.9 175.105C293.27 155.235 296.88 117.925 275.81 93.6446C234.59 46.1746 121.51 26.9446 58.1 94.2646C18.43 136.365 50.96 240.855 136.58 216.195C155.4 210.785 163.32 210.965 205.96 217.355C248.57 223.725 277.67 197.285 285.9 175.095V175.105Z" fill="white"/>
<path d="M317.98 85.4646C327 102.245 331.98 120.795 331.98 140.295C331.98 215.585 257.66 276.615 166 276.615C74.34 276.615 0 215.575 0 140.295C0 65.0146 74.32 3.97461 166 3.97461C233.91 3.97461 292.29 37.4846 317.98 85.4546" fill="#5A78FE"/>
<path d="M313.479 0.224609C322.589 0.224609 329.969 7.82461 329.969 17.2146C329.969 26.6046 322.599 34.1846 313.479 34.1846C304.359 34.1846 296.989 26.5846 296.989 17.2146C296.989 7.84461 304.379 0.224609 313.479 0.224609Z" fill="#5A77FA"/>
<path d="M273.149 173.094C279.689 154.924 282.889 120.784 264.189 98.5737C227.599 55.1537 127.179 37.5637 70.8691 99.1437C35.6491 137.644 64.5191 233.224 140.559 210.674C157.269 205.714 164.319 205.894 202.159 211.734C239.999 217.574 265.849 193.384 273.149 173.094Z" fill="#5A78FE"/>
<path d="M266.73 107.114C285.43 129.324 282.23 163.464 275.69 181.634C268.39 201.934 242.54 226.124 204.7 220.274C166.86 214.434 159.81 214.254 143.1 219.214C67.0699 241.774 38.1999 146.194 73.4099 107.684C129.72 46.1043 230.14 63.6842 266.73 107.114Z" fill="#3661D8"/>
<path d="M264.19 98.5752C282.89 120.785 279.69 154.925 273.15 173.095C265.85 193.395 240 217.585 202.16 211.735C164.32 205.895 157.27 205.715 140.56 210.675C64.5299 233.235 35.6599 137.655 70.8699 99.1452C127.18 37.5652 227.6 55.1452 264.19 98.5752Z" fill="#EDEDEF"/>
<path d="M16.8396 0.224609C25.9496 0.224609 33.3296 7.82461 33.3296 17.2146C33.3296 26.6046 25.9596 34.1846 16.8396 34.1846C7.71961 34.1846 0.349609 26.5846 0.349609 17.2146C0.349609 7.84461 7.71961 0.224609 16.8396 0.224609ZM314.23 101.075C312.11 101.075 310.4 99.3746 310.4 97.2546V34.1846C310.4 32.0646 312.12 30.3546 314.23 30.3546C316.34 30.3546 318.06 32.0746 318.06 34.1846V97.2246C318.06 99.3446 316.34 101.075 314.23 101.075Z" fill="#5A77FA"/>
<path d="M17.5898 105.185C15.4698 105.185 13.7598 103.465 13.7598 101.355V34.1952C13.7598 32.0752 15.4798 30.3652 17.5898 30.3652C19.6998 30.3652 21.4198 32.0852 21.4198 34.1952V101.355C21.4198 103.475 19.6998 105.185 17.5898 105.185Z" fill="#5A77FA"/>
<path d="M165.67 187.335C153.64 187.335 142.65 181.075 136.27 170.585C135.17 168.775 135.75 166.415 137.55 165.315C139.36 164.215 141.72 164.795 142.82 166.595C147.79 174.775 156.33 179.655 165.67 179.655C175.01 179.655 184.18 174.335 188.99 165.765C190.03 163.915 192.36 163.265 194.21 164.295C196.06 165.335 196.71 167.665 195.68 169.515C189.52 180.495 178.02 187.315 165.68 187.315L165.67 187.335ZM98.1601 137.865C96.0401 137.865 94.3301 136.145 94.3301 134.035C94.3301 122.365 103.6 112.865 115 112.865C121.34 112.865 127.23 115.765 131.16 120.835C132.46 122.505 132.15 124.915 130.48 126.215C128.81 127.515 126.4 127.205 125.1 125.535C122.63 122.355 118.95 120.535 115 120.535C107.83 120.535 102 126.595 102 134.045C102 136.165 100.28 137.875 98.1701 137.875L98.1601 137.865ZM232.51 137.865C230.39 137.865 228.68 136.145 228.68 134.035C228.68 126.585 222.85 120.525 215.68 120.525C211.73 120.525 208.05 122.345 205.58 125.525C204.28 127.195 201.87 127.495 200.2 126.205C198.53 124.905 198.22 122.495 199.52 120.825C203.45 115.765 209.34 112.855 215.68 112.855C227.08 112.855 236.35 122.355 236.35 134.025C236.35 136.145 234.63 137.855 232.52 137.855L232.51 137.865Z" fill="black"/>
<path d="M318.06 75.9144V94.8444C316.88 92.1244 315.6 89.4444 314.23 86.8044C313.02 84.4844 311.75 82.2044 310.4 79.9544V64.4844C313.16 68.1844 315.72 71.9944 318.07 75.9144H318.06ZM21.4298 66.4744V82.4144C18.4998 87.5544 15.9298 92.8644 13.7598 98.3444V78.3944C16.0998 74.3144 18.6598 70.3344 21.4298 66.4744Z" fill="#3661D8"/>
</g>
<defs>
<filter id="filter0_d_424_57" x="0" y="0.224609" width="341.98" height="292.391" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dx="6" dy="12"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_424_57"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_424_57" result="shape"/>
</filter>
</defs>
</svg>

              Simple Chat
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 22,
                color: '#888',
                cursor: 'pointer',
                borderRadius: 8,
                padding: 4,
                marginLeft: 8,
                transition: 'background 0.2s',
              }}
              aria-label="Close chat"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" fill="#888"/></svg>
            </button>
          </div>

          <div ref={chatWindowRef} style={{ height: '350px', maxHeight: '350px', border: '1px solid #e5e7eb', padding: '16px', overflowY: 'auto', marginBottom: '16px', background: '#f8fafc', borderRadius: 0 }}>
            {chatLog.map((entry, i) => (
              <div key={i} style={{ margin: '8px 0', textAlign: entry.type === 'user' ? 'right' : 'left' }}>
                <span style={{ background: entry.type === 'user' ? '#dbeafe' : '#f1f5f9', color: '#222', padding: '10px 16px', borderRadius: entry.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', display: 'inline-block', maxWidth: '80%', fontSize: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <ReactMarkdown>{entry.text}</ReactMarkdown>
                </span>
              </div>
            ))}
            {isBotLoading && (
              <div style={{ margin: '8px 0', textAlign: 'left' }}>
                <span style={{ background: '#f1f5f9', padding: '10px 16px', borderRadius: '16px 16px 16px 4px', display: 'inline-block', color: '#888', fontSize: '1rem' }}>
                  AI is typing...
                </span>
              </div>
            )}
          </div>

          <form style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, marginLeft: 16, marginRight: 16, marginBottom: 16 }} onSubmit={e => { e.preventDefault(); handleSendMessage(); }}>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              style={{ flex: 1, padding: '12px 16px', borderRadius: 24, border: '1px solid #e5e7eb', fontSize: '1rem', outline: 'none', background: '#fff', marginRight: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
            />
            <button
              type="submit"
              style={{
                background: '#2563eb',
                border: 'none',
                borderRadius: '50%',
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
                transition: 'background 0.2s',
                marginLeft: 4
              }}
              disabled={isBotLoading || !message.trim()}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="#fff"/>
              </svg>
            </button>
          </form>


        </div>
      )}
    </>
  );
};

export default ChatApp;
