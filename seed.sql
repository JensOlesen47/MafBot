--
-- PostgreSQL database dump
--

-- Dumped from database version 12.0
-- Dumped by pg_dump version 12.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: game_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.game_history (
    id bigint NOT NULL,
    fksetup integer,
    winningteam character varying(25),
    "timestamp" date,
    guildid character varying(100),
    video boolean
);


ALTER TABLE public.game_history OWNER TO postgres;

--
-- Name: game_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.game_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.game_history_id_seq OWNER TO postgres;

--
-- Name: game_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.game_history_id_seq OWNED BY public.game_history.id;


--
-- Name: setup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.setup (
    id integer NOT NULL,
    name character varying(100)
);


ALTER TABLE public.setup OWNER TO postgres;

--
-- Name: setup_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.setup_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.setup_id_seq OWNER TO postgres;

--
-- Name: setup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.setup_id_seq OWNED BY public.setup.id;


--
-- Name: user_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_history (
    fkgamehistory bigint NOT NULL,
    userid character varying(100) NOT NULL,
    role character varying(255) NOT NULL,
    team character varying(50) NOT NULL,
    won boolean,
    death character varying(255),
    username character varying(255)
);


ALTER TABLE public.user_history OWNER TO postgres;

--
-- Name: game_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_history ALTER COLUMN id SET DEFAULT nextval('public.game_history_id_seq'::regclass);


--
-- Name: setup id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setup ALTER COLUMN id SET DEFAULT nextval('public.setup_id_seq'::regclass);


--
-- Data for Name: setup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.setup (id, name) FROM stdin;
1	moderated
2	straight
3	lovers
4	lyncher
5	assassin
6	ss3
7	vengeful
8	maflovers
9	masons
10	kidswithguns
11	paritycop
12	fogofwar
13	451
14	vig
\.


--
-- Name: setup_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.setup_id_seq', 14, true);


--
-- Name: game_history game_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_history
    ADD CONSTRAINT game_history_pkey PRIMARY KEY (id);


--
-- Name: setup setup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setup
    ADD CONSTRAINT setup_pkey PRIMARY KEY (id);


--
-- Name: user_history user_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_history
    ADD CONSTRAINT user_history_pkey PRIMARY KEY (fkgamehistory, userid);


--
-- Name: game_history game_history_fksetup_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_history
    ADD CONSTRAINT game_history_fksetup_fkey FOREIGN KEY (fksetup) REFERENCES public.setup(id);


--
-- Name: user_history user_history_fkgamehistory_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_history
    ADD CONSTRAINT user_history_fkgamehistory_fkey FOREIGN KEY (fkgamehistory) REFERENCES public.game_history(id);


--
-- PostgreSQL database dump complete
--

