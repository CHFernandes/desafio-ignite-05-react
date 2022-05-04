import { GetStaticProps } from 'next';

import * as prismic from '@prismicio/client';
import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page, results } = postsPagination;

  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  function fetchNextPage(): void {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        const { results: newResults, next_page: newNextPage } = data;
        const newPosts = newResults.map(post => {
          return {
            slug: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        }) as Post[];
        setPosts([...posts, ...newPosts]);
        setNextPage(newNextPage);
      });
  }

  return (
    <>
      <Header />
      <div className={commonStyles.container}>
        {posts.map(post => (
          <Link key={post.data.title} href={`/post/${post.uid}`}>
            <div className={styles.postContainer}>
              <h2>{post.data.title}</h2>
              <p>{post.data.subtitle}</p>
              <div>
                <div>
                  <AiOutlineCalendar />
                  <span>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      { locale: ptBR }
                    )}
                  </span>
                </div>
                <div>
                  <AiOutlineUser />
                  <span>{post.data.author}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {nextPage && (
          <button
            type="button"
            className={styles.loadButton}
            onClick={fetchNextPage}
          >
            Carregar mais posts
          </button>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismicClient = getPrismicClient({});

  const postsResponse = await prismicClient.getByType('posts', {
    predicates: [prismic.predicate.at('document.type', 'posts')],
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1,
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  }) as Post[];

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
