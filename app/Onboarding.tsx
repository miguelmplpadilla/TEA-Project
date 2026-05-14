import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Register, { type RegisterHandle } from './Register';
import {comfortSkillOptions, interestTags, lookingForOptions, socialSkillsOptions} from "@/lib/Data";
import {TagSelector} from "@/components/TagSelector";
import {SelectComponent, type SelectOption} from "@/components/SelectComponent";

type OnboardingSlide = {
  title: string;
  body: string;
  accent: string;
  checkInput: boolean;
  isCheckedInput: boolean;
};

const slides: OnboardingSlide[] = [
  {
    title: 'Encuentra personas con las que encajes',
    body: 'Comparte intereses, pensamientos y momentos en un espacio mas tranquilo y humano.',
    accent: '#FF595E', // rojo
    checkInput: false,
    isCheckedInput: true
  },
  {
    title: 'Comparte lo que te gusta',
    body: 'Publica, comenta y descubre personas con intereses y formas de socializar similares.',
    accent: '#FF924C', // naranja
    checkInput: false,
    isCheckedInput: true
  },
  {
    title: 'Guarda tu espacio',
    body: 'Crea una cuenta para mantener tu perfil, publicaciones e interacciones sincronizadas.',
    accent: '#FFCA3A', // amarillo
    checkInput: false,
    isCheckedInput: true
  },
];

const nameSlide: OnboardingSlide = {
  title: '¿Como te llamas?',
  body: 'Tu nombre ayudara a que otras personas sepan como dirigirse a ti.',
  accent: '#8AC926', // verde
  checkInput: true,
  isCheckedInput: false
};

const registerSlide: OnboardingSlide = {
  title: 'Crea tu cuenta',
  body: 'Registra tus datos para empezar a personalizar tu espacio.',
  accent: '#1982C4', // azul
  checkInput: true,
  isCheckedInput: false
};

const descriptionSlide: OnboardingSlide = {
  title: 'Hablanos sobre ti',
  body: 'Escribe una pequeña descripcion para que otras personas puedan conocerte mejor.',
  accent: '#4267AC', // azul oscuro
  checkInput: true,
  isCheckedInput: false
};

const interestsSlide: OnboardingSlide = {
  title: 'Tus intereses',
  body: 'Selecciona algunas cosas que te gusten para encontrar personas compatibles contigo.',
  accent: '#6A4C93', // violeta
  checkInput: true,
  isCheckedInput: false
};

const socialSkillsSlide: OnboardingSlide = {
  title: 'Como socializas',
  body: 'Ayuda a los demas a entender como te gusta comunicarte y relacionarte.',
  accent: '#B5179E', // magenta
  checkInput: true,
  isCheckedInput: false
};

const comfortOptionsSlide: OnboardingSlide = {
  title: 'Tu espacio comodo',
  body: 'Selecciona ambientes, situaciones o formas de hablar que te hagan sentir mejor.',
  accent: '#F72585', // rosa
  checkInput: true,
  isCheckedInput: false
};

const lookingForSlide: OnboardingSlide = {
  title: '¿Que buscas aqui?',
  body: 'Cuéntanos que tipo de conexiones o amistades te gustaria encontrar.',
  accent: '#7209B7', // morado intenso
  checkInput: true,
  isCheckedInput: false
};

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const registerRef = useRef<RegisterHandle>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [registerCanSubmit, setRegisterCanSubmit] = useState(false);
  const [registerIsSubmitting, setRegisterIsSubmitting] = useState(false);
  const [paginationSlides, setPaginationSlides] = useState([
    ...slides,
    nameSlide,
    descriptionSlide,
    interestsSlide,
    socialSkillsSlide,
    comfortOptionsSlide,
    lookingForSlide,
    registerSlide,
  ]);

  const [socialSkill, setSocialSkill] = useState<SelectOption[]>([]);
  const [comfortOptions, setComfortOptions] = useState<SelectOption[]>([]);
  const [lookingFor, setLookingFor] = useState<SelectOption[]>([]);

  const [interests, setInterests] = useState<string[]>([]);

  const [registerIndex, setRegisterIndex] = useState(0);

  const isRegisterSlide = activeIndex === registerIndex;

  const [canPressNext, setCanPressNext] = useState(true);

  const [displayName, setDisplayName] = useState('');
  const [desriptionUser, setDescriptionUser] = useState('');

  useEffect(() => {
    for (let i = 0; i < paginationSlides.length; i++) {
      if (paginationSlides[i] === registerSlide)
        setRegisterIndex(i);
    }
  }, []);

  function SetTextInput(
      setState: React.Dispatch<React.SetStateAction<string>>
  ) {
    return (text: string) => {
      const isValid = text.trim() !== "";

      setState(text)
      setCanPressNext(isValid)

      setPaginationSlides(prev =>
          prev.map((slide, index) =>
              index === activeIndexRef.current
                  ? { ...slide, isCheckedInput: isValid }
                  : slide
          )
      );
    };
  }

  function SetTagInput(
      setState: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    return (texts: string[]) => {
      const isValid = texts.length !== 0;

      setState(texts)
      setCanPressNext(isValid)

      setPaginationSlides(prev =>
          prev.map((slide, index) =>
              index === activeIndexRef.current
                  ? { ...slide, isCheckedInput: isValid }
                  : slide
          )
      );
    };
  }

  function SetSelectorInput(
      setState: React.Dispatch<React.SetStateAction<SelectOption[]>>
  ) {
    return (texts: SelectOption[]) => {
      const isValid = texts.length !== 0;

      setState(texts)
      setCanPressNext(isValid)

      setPaginationSlides(prev =>
          prev.map((slide, index) =>
              index === activeIndexRef.current
                  ? { ...slide, isCheckedInput: isValid }
                  : slide
          )
      );
    };
  }

  function setCurrentSlideIndex(nextIndex: number) {
    activeIndexRef.current = nextIndex;
    setActiveIndex((currentIndex) => (currentIndex === nextIndex ? currentIndex : nextIndex));
    setCanPressNext(paginationSlides[nextIndex]?.isCheckedInput ?? true);
  }

  function scrollToSlide(nextIndex: number, animated = true) {
    scrollRef.current?.scrollTo({
      x: nextIndex * width,
      animated,
    });
  }

  function handleNext() {
    const currentIndex = activeIndexRef.current;

    if (currentIndex === registerIndex) {
      registerRef.current?.submit();
      return;
    }

    if (!paginationSlides[currentIndex]?.isCheckedInput) return;

    const nextIndex = currentIndex + 1;
    setCurrentSlideIndex(nextIndex);
    scrollToSlide(nextIndex);
  }

  function handleBack() {
    const currentIndex = activeIndexRef.current;

    if (currentIndex === 0) {
      return;
    }

    const nextIndex = currentIndex - 1;
    setCurrentSlideIndex(nextIndex);
    scrollToSlide(nextIndex);
  }

  function updateActiveIndex(offsetX: number) {
    const nextIndex = Math.min(
      Math.max(Math.round(offsetX / width), 0),
      paginationSlides.length - 1,
    );

    if (nextIndex !== activeIndexRef.current) {
      setCurrentSlideIndex(nextIndex);
    }
  }

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    updateActiveIndex(event.nativeEvent.contentOffset.x);
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    updateActiveIndex(event.nativeEvent.contentOffset.x);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
        horizontal
        pagingEnabled
        bounces={false}
        scrollEnabled={false}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
          listener: handleScroll,
        })}
      >
        {slides.map((slide, index) => {
          return (
            <View key={slide.title} style={[styles.slide, { width }]}>
              <View style={styles.content}>
                <View style={[styles.imageWrap]}>
                  <Image source={require('../assets/images/TEA-Icon.png')} style={styles.image} />
                </View>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.body}>{slide.body}</Text>
              </View>
            </View>
          );
        })}

        <View style={[styles.slide, { width }]}>
          <View style={styles.content}>
            <View style={[styles.imageWrap, { borderColor: '#20352b' }]}>
              <Image source={require('../assets/images/TEA-Icon.png')} style={styles.image} />
            </View>
            <Text style={styles.title}>Dinos tu nombre</Text>
            <Text style={styles.body}>Necesitamos un nombre para saber como referirnos a ti</Text>
            <TextInput
                autoCapitalize="words"
                placeholder="Tu nombre"
                style={[styles.input, {width: '100%'}]}
                value={displayName}
                onChangeText={SetTextInput(setDisplayName)}
            />
          </View>
        </View>

        <View style={[styles.slide, { width }]}>
          <View style={[styles.content, styles.descriptionContent]}>
            <View style={[styles.imageWrap, { borderColor: '#20352b' }]}>
              <Image source={require('../assets/images/TEA-Icon.png')} style={styles.image} />
            </View>
            <Text style={styles.title}>Cuentanos sobre ti, como eres?</Text>
            <Text style={styles.body}>Sientete libre de describirte o contar tus intereses</Text>
            <View style={styles.descriptionInputWrap}>
              <TextInput
                  autoCapitalize="words"
                  placeholder="Escribe sobre ti"
                  style={[styles.input, styles.descriptionInput]}
                  multiline
                  textAlignVertical="top"
                  value={desriptionUser}
                  onChangeText={SetTextInput(setDescriptionUser)}
              />
            </View>
          </View>
        </View>

        <View style={[styles.slide, { width }]}>
          <View style={styles.content}>
            <View style={[styles.imageWrap, { borderColor: '#20352b' }]}>
              <Image source={require('../assets/images/TEA-Icon.png')} style={styles.image} />
            </View>
            <Text style={styles.title}>Que te interesa?</Text>
            <Text style={styles.body}>Cuentanos, que cosas te gustan?</Text>
            <TagSelector
                interests={interestTags}
                value={interests}
                onValueChange={SetTagInput(setInterests)}
            />
          </View>
        </View>

        <View style={[styles.slide, { width }]}>
          <View style={styles.content}>
            <View style={[styles.imageWrap, { borderColor: '#20352b' }]}>
              <Image source={require('../assets/images/TEA-Icon.png')} style={styles.image} />
            </View>
            <Text style={styles.title}>Como son tus habilidades sociales?</Text>
            <Text style={styles.body}>Esto te ayudara a ti y a otras personas a relacionarse mejor</Text>
            <SelectComponent
                options={socialSkillsOptions}
                value={socialSkill}
                onValueChange={SetSelectorInput(setSocialSkill)}
                maxItemsSelect={3}
                contentItemsSize={110}
            />
          </View>
        </View>

        <View style={[styles.slide, { width }]}>
          <View style={styles.content}>
            <View style={[styles.imageWrap, { borderColor: '#20352b' }]}>
              <Image source={require('../assets/images/TEA-Icon.png')} style={styles.image} />
            </View>
            <Text style={styles.title}>Como son tus habilidades sociales?</Text>
            <Text style={styles.body}>Esto te ayudara a ti y a otras personas a relacionarse mejor</Text>
            <SelectComponent
                options={comfortSkillOptions}
                value={comfortOptions}
                onValueChange={SetSelectorInput(setComfortOptions)}
                maxItemsSelect={3}
                contentItemsSize={110}
            />
          </View>
        </View>

        <View style={[styles.slide, { width }]}>
          <View style={styles.content}>
            <View style={[styles.imageWrap, { borderColor: '#20352b' }]}>
              <Image source={require('../assets/images/TEA-Icon.png')} style={styles.image} />
            </View>
            <Text style={styles.title}>Que estas buscando aqui?</Text>
            <Text style={styles.body}>Cuentanos cuales son tus preferencias, que estas buscando hacer?</Text>
            <SelectComponent
                options={lookingForOptions}
                value={lookingFor}
                onValueChange={SetSelectorInput(setLookingFor)}
                maxItemsSelect={3}
                contentItemsSize={110}
            />
          </View>
        </View>

        <View style={[styles.registerSlide, { width }]}>
          <Register
            ref={registerRef}
            showSubmitButton={false}
            onStateChange={({ canSubmit, isSubmitting }) => {
              setRegisterCanSubmit(canSubmit);
              setRegisterIsSubmitting(isSubmitting);
            }}
          />
        </View>
      </Animated.ScrollView>

      <View style={styles.dots}>
        {paginationSlides.map((slide, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 26, 8],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={slide.title}
              style={[styles.dot, { backgroundColor: slide.accent, width: dotWidth }]}
            />
          );
        })}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={activeIndex === 0}
          style={[styles.secondaryButton, activeIndex === 0 && styles.disabledButton]}
          onPress={handleBack}
        >
          <Text style={styles.secondaryButtonText}>Atras</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.82}
          disabled={registerIsSubmitting}
          style={[
            styles.primaryButton,
            (!canPressNext)
                ? styles.disabledButton
                : styles.activeButton
          ]}
          onPress={handleNext}
        >
          {registerIsSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isRegisterSlide ? 'Crear cuenta' : 'Siguiente'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f3',
  },
  carousel: {
    flex: 1,
  },
  carouselContent: {
    flexGrow: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  registerSlide: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  descriptionContent: {
    flex: 1,
    width: '100%',
  },
  descriptionInputWrap: {
    flex: 1,
    marginTop: 10,
    width: '90%',
  },
  descriptionInput: {
    flex: 1,
    marginTop: 0,
  },
  imageWrap: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 0,
    height: 128,
    justifyContent: 'center',
    marginBottom: 34,
    width: 128,
  },
  image: {
    height: 82,
    resizeMode: 'contain',
    width: 82,
  },
  title: {
    color: '#111814',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    maxWidth: 340,
    textAlign: 'center',
  },
  body: {
    color: '#526057',
    fontSize: 17,
    lineHeight: 25,
    marginTop: 12,
    maxWidth: 360,
    textAlign: 'center',
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    borderRadius: 4,
    height: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 32,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#20352b',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#cdd8d0',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  secondaryButtonText: {
    color: '#20352b',
    fontSize: 16,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.35,
  },
  activeButton: {
    opacity: 1,
  },
  input: {
    backgroundColor: '#f8faf8',
    borderColor: '#d7e0d9',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111814',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
    marginTop: 10
  },
});
