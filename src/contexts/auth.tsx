import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
}

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
}

export const AuthContext = createContext({} as AuthContextData)

type AuthProvider = {
  children: ReactNode;
}

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    avatar_url: string;
    login: string;
  }
}

export function AuthProvider(props: AuthProvider) {
  const [user, setUser] = useState<User | null>(null);

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=96114671a5ca4a1d5673`;

  async function signIn(githubCode: string) {
    const response = await api.post<AuthResponse>('authenticate', { code: githubCode });

    const { token, user } = response.data;

    localStorage.setItem('@dtk', token);
    
    api.defaults.headers.common.authorization = token;

    setUser(user)
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem('@dtk');
  }

  useEffect(() => {
    const token = localStorage.getItem('@dtk');
    if (token) {
      api.defaults.headers.common.authorization = token;
      api.get('profile').then(response => {
        setUser(response.data)
      })
    }
  }, [])

  useEffect(() => {
    const url = window.location.href;
    const hasGithubCode = url.includes('?code=')

    if (hasGithubCode) {
      const [urlWithoutCode, githubCode] = url.split('?code=')
      window.history.pushState({}, '', urlWithoutCode)
      signIn(githubCode)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ signInUrl, user, signOut }}>
      {props.children}
    </AuthContext.Provider>

  );
}