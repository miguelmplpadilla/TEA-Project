import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
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
import * as ImagePicker from 'expo-image-picker';
import {Ionicons} from '@expo/vector-icons';
import Register, { type RegisterHandle } from './Register';
import LoginForm, {type LoginHandle} from '@/components/LoginForm';
import {DiagnosisBadge} from '@/components/DiagnosisBadge';
import {comfortSkillOptions, interestTags, lookingForOptions, socialSkillsOptions} from "@/lib/Data";
import {TagSelector} from "@/components/TagSelector";
import {SelectComponent, type SelectOption} from "@/components/SelectComponent";
import {isUserNameAvailable, isValidUserName, normalizeUserName} from "@/services/users";
import {
  defaultTeaDiagnosis,
  teaDiagnosisOptions,
  type TeaDiagnosis,
} from '@/constants/teaDiagnosis';

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

const welcomeSlide: OnboardingSlide = {
  title: 'TEARS',
  body: 'Elige como quieres entrar.',
  accent: '#20352b',
  checkInput: false,
  isCheckedInput: true,
};

const userNameSlide: OnboardingSlide = {
  title: 'Elige tu usuario',
  body: 'Este sera tu identificador unico dentro de TEARS.',
  accent: '#4CB944',
  checkInput: true,
  isCheckedInput: false
};

const diagnosisSlide: OnboardingSlide = {
  title: 'Como te identificas',
  body: 'Puedes responder ahora o seguir explorando sin elegir una opcion.',
  accent: '#8b9490',
  checkInput: true,
  isCheckedInput: true,
};

const registerSlide: OnboardingSlide = {
  title: 'Crea tu cuenta',
  body: 'Registra tus datos para empezar a personalizar tu espacio.',
  accent: '#1982C4', // azul
  checkInput: true,
  isCheckedInput: false
};

const loginSlide: OnboardingSlide = {
  title: 'Iniciar sesion',
  body: 'Accede si ya tienes una cuenta.',
  accent: '#20352b',
  checkInput: true,
  isCheckedInput: false,
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

const psychologistSlide: OnboardingSlide = {
  title: 'Acreditacion profesional',
  body: 'Si eres psicologa colegiada, puedes dejar una referencia profesional para comprobarlo.',
  accent: '#008a7a',
  checkInput: true,
  isCheckedInput: true,
};

export async function pickImage(onPicked: (uri: string) => void) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert('Permiso necesario', 'Necesitas permitir acceso a tus fotos.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled) {
    onPicked(result.assets[0].uri);
  }
}

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const registerRef = useRef<RegisterHandle>(null);
  const loginRef = useRef<LoginHandle>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [registerCanSubmit, setRegisterCanSubmit] = useState(false);
  const [registerIsSubmitting, setRegisterIsSubmitting] = useState(false);
  const [loginCanSubmit, setLoginCanSubmit] = useState(false);
  const [loginIsSubmitting, setLoginIsSubmitting] = useState(false);
  const [paginationSlides, setPaginationSlides] = useState([
    welcomeSlide,
    ...slides,
    userNameSlide,
    descriptionSlide,
    interestsSlide,
    socialSkillsSlide,
    comfortOptionsSlide,
    lookingForSlide,
    psychologistSlide,
    diagnosisSlide,
    registerSlide,
    loginSlide,
  ]);

  const [socialSkill, setSocialSkill] = useState<SelectOption[]>([]);
  const [comfortOptions, setComfortOptions] = useState<SelectOption[]>([]);
  const [lookingFor, setLookingFor] = useState<SelectOption[]>([]);
  const [teaDiagnosis, setTeaDiagnosis] = useState<SelectOption[]>([]);

  const [interests, setInterests] = useState<string[]>([]);
  const [canPressNext, setCanPressNext] = useState(true);

  const [userName, setUserName] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [profileBackgroundUri, setProfileBackgroundUri] = useState<string | null>(null);
  const [userNameMessage, setUserNameMessage] = useState('');
  const [userNameIsChecking, setUserNameIsChecking] = useState(false);
  const [desriptionUser, setDescriptionUser] = useState('');
  const [isPsychologist, setIsPsychologist] = useState(false);
  const [collegiateNumber, setCollegiateNumber] = useState('');
  const [psychologistVerificationDescription, setPsychologistVerificationDescription] = useState('');

  const registerIndex = paginationSlides.findIndex((slide) => slide.title === registerSlide.title);
  const userNameIndex = paginationSlides.findIndex((slide) => slide.title === userNameSlide.title);
  const psychologistIndex = paginationSlides.findIndex((slide) => slide.title === psychologistSlide.title);
  const loginIndex = paginationSlides.findIndex((slide) => slide.title === loginSlide.title);
  const isRegisterSlide = activeIndex === registerIndex;
  const isLoginSlide = activeIndex === loginIndex;
  const isWelcomeSlide = activeIndex === 0;
  const currentCanContinue = isRegisterSlide ? registerCanSubmit : isLoginSlide ? loginCanSubmit : canPressNext;
  const currentIsSubmitting = registerIsSubmitting || loginIsSubmitting || userNameIsChecking;

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

  function SetUserNameInput(text: string) {
    const nextUserName = normalizeUserName(text).replace(/[^a-z0-9._-]/g, '').slice(0, 20);
    const isValid = isValidUserName(nextUserName);

    setUserName(nextUserName);
    setUserNameMessage('');
    setCanPressNext(isValid);

    setPaginationSlides(prev =>
        prev.map((slide, index) =>
            index === activeIndexRef.current
                ? { ...slide, isCheckedInput: isValid }
                : slide
        )
    );
  }

  function setPsychologistSlideValidity(isValid: boolean) {
    setCanPressNext(isValid);
    setPaginationSlides(prev =>
        prev.map((slide, index) =>
            index === psychologistIndex
                ? { ...slide, isCheckedInput: isValid }
                : slide
        )
    );
  }

  function togglePsychologistOption() {
    const nextValue = !isPsychologist;

    setIsPsychologist(nextValue);
    setPsychologistSlideValidity(
        !nextValue ||
        collegiateNumber.trim().length > 0 ||
        psychologistVerificationDescription.trim().length > 0
    );
  }

  function SetCollegiateNumberInput(text: string) {
    setCollegiateNumber(text);
    setPsychologistSlideValidity(
        !isPsychologist ||
        text.trim().length > 0 ||
        psychologistVerificationDescription.trim().length > 0
    );
  }

  function SetPsychologistVerificationDescriptionInput(text: string) {
    setPsychologistVerificationDescription(text);
    setPsychologistSlideValidity(
        !isPsychologist ||
        collegiateNumber.trim().length > 0 ||
        text.trim().length > 0
    );
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

  async function checkUserNameAndContinue() {
    if (!isValidUserName(userName)) {
      setUserNameMessage('Usa entre 3 y 20 caracteres: letras, numeros, punto, guion o guion bajo.');
      return;
    }

    setUserNameIsChecking(true);
    setUserNameMessage('');

    try {
      const available = await isUserNameAvailable(userName);

      if (!available) {
        setUserNameMessage('Ese nombre de usuario ya existe.');
        setCanPressNext(false);
        setPaginationSlides(prev =>
            prev.map((slide, index) =>
                index === activeIndexRef.current
                    ? { ...slide, isCheckedInput: false }
                    : slide
            )
        );
        return;
      }

      const nextIndex = activeIndexRef.current + 1;
      setCurrentSlideIndex(nextIndex);
      scrollToSlide(nextIndex);
    } catch {
      setUserNameMessage('No se pudo comprobar el usuario. Revisa la conexion.');
    } finally {
      setUserNameIsChecking(false);
    }
  }

  function handleNext() {
    const currentIndex = activeIndexRef.current;

    if (currentIndex === loginIndex) {
      loginRef.current?.submit();
      return;
    }

    if (currentIndex === registerIndex) {
      registerRef.current?.submit();
      return;
    }

    if (currentIndex === userNameIndex) {
      void checkUserNameAndContinue();
      return;
    }

    if (!paginationSlides[currentIndex]?.isCheckedInput) return;

    const nextIndex = currentIndex + 1;
    setCurrentSlideIndex(nextIndex);
    scrollToSlide(nextIndex);
  }

  function handleBack() {
    const currentIndex = activeIndexRef.current;

    if (currentIndex === loginIndex) {
      setCurrentSlideIndex(0);
      scrollToSlide(0);
      return;
    }

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

  function goToRegistrationFlow() {
    const nextIndex = 1;
    setCurrentSlideIndex(nextIndex);
    scrollToSlide(nextIndex);
  }

  function goToLogin() {
    setCurrentSlideIndex(loginIndex);
    scrollToSlide(loginIndex);
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
        <View style={[styles.slide, { width }]}>
          <View style={styles.content}>
            <View style={[styles.imageWrap, {borderColor: '#20352b'}]}>
              <Image source={require('../assets/images/TEA-Icon.png')} resizeMode="contain" style={styles.image} />
            </View>
            <Text style={styles.title}>TEARS</Text>
            <Text style={styles.body}>Crea tu perfil o entra con tu cuenta para continuar.</Text>

            <View style={styles.welcomeActions}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.welcomePrimaryButton}
                onPress={goToRegistrationFlow}
              >
                <Text style={styles.welcomePrimaryButtonText}>Crear cuenta</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.welcomeSecondaryButton}
                onPress={goToLogin}
              >
                <Text style={styles.welcomeSecondaryButtonText}>Ya tengo cuenta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {slides.map((slide, index) => {
          return (
            <View key={slide.title} style={[styles.slide, { width }]}>
              <View style={styles.content}>
                <View style={[styles.imageWrap]}>
                  <Image source={require('../assets/images/TEA-Icon.png')} resizeMode="contain" style={styles.image} />
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
              <Image source={require('../assets/images/TEA-Icon.png')} resizeMode="contain" style={styles.image} />
            </View>
            <Text style={styles.title}>Elige tu nombre de usuario</Text>
            <Text style={styles.body}>Debe ser unico. Podras usarlo para que otras personas te encuentren.</Text>
            <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="usuario"
                style={[styles.input, {width: '100%'}]}
                value={userName}
                onChangeText={SetUserNameInput}
            />
            {userNameMessage ? <Text style={styles.inputMessage}>{userNameMessage}</Text> : null}

            <View style={styles.optionalPhotos}>
              <TouchableOpacity
                  activeOpacity={0.82}
                  style={styles.backgroundPicker}
                  onPress={() => pickImage(setProfileBackgroundUri)}
              >
                {profileBackgroundUri ? (
                    <Image source={{ uri: profileBackgroundUri }} resizeMode="cover" style={styles.backgroundPreview} />
                ) : (
                    <Text style={styles.photoPickerText}>Fondo</Text>
                )}
                <View style={styles.photoEditBadge}>
                  <Text style={styles.photoEditBadgeText}>+</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                  activeOpacity={0.82}
                  style={styles.avatarPicker}
                  onPress={() => pickImage(setProfileImageUri)}
              >
                <Image
                    source={
                      profileImageUri
                          ? { uri: profileImageUri }
                          : require('../assets/images/DefaultPorfilePicture.png')
                    }
                    resizeMode="cover"
                    style={styles.avatarPreview}
                />
                <View style={styles.photoEditBadge}>
                  <Text style={styles.photoEditBadgeText}>+</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.slide, { width }]}>
          <View style={[styles.content, styles.descriptionContent]}>
            <View style={[styles.imageWrap, { borderColor: '#20352b' }]}>
              <Image source={require('../assets/images/TEA-Icon.png')} resizeMode="contain" style={styles.image} />
            </View>
            <Text style={styles.title}>Cuentanos sobre ti, como eres?</Text>
            <Text style={styles.body}>Sientete libre de describirte o contar tus intereses</Text>
            <View style={styles.descriptionInputWrap}>
              <TextInput
                  autoCapitalize="sentences"
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
              <Image source={require('../assets/images/TEA-Icon.png')} resizeMode="contain" style={styles.image} />
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
              <Image source={require('../assets/images/TEA-Icon.png')} resizeMode="contain" style={styles.image} />
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
              <Image source={require('../assets/images/TEA-Icon.png')} resizeMode="contain" style={styles.image} />
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
              <Image source={require('../assets/images/TEA-Icon.png')} resizeMode="contain" style={styles.image} />
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

        <View style={[styles.slide, styles.psychologistScrollSlide, { width }]}>
          <ScrollView
              style={styles.slideScroll}
              contentContainerStyle={styles.slideScrollContent}
              showsVerticalScrollIndicator
          >
            <View style={styles.content}>
              <View style={[styles.imageWrap, { borderColor: '#20352b' }]}>
                <Image source={require('../assets/images/TEA-Icon.png')} resizeMode="contain" style={styles.image} />
              </View>
              <Text style={styles.title}>Eres psicologa?</Text>
              <Text style={styles.body}>
                Puedes pedir la acreditacion ahora. El perfil no lo mostrara hasta que se compruebe.
              </Text>

              <TouchableOpacity
                  activeOpacity={0.82}
                  style={styles.psychologistOption}
                  onPress={togglePsychologistOption}
              >
                <View style={[styles.psychologistCheckbox, isPsychologist && styles.psychologistCheckboxChecked]}>
                  {isPsychologist ? <Ionicons name="checkmark" style={styles.psychologistCheckboxIcon} /> : null}
                </View>
                <Text style={styles.psychologistOptionText}>Soy psicologa colegiada</Text>
              </TouchableOpacity>

              {isPsychologist ? (
                  <View style={styles.psychologistFields}>
                    <TextInput
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={40}
                        placeholder="Numero de colegiacion"
                        style={[styles.input, styles.collegiateNumberInput]}
                        value={collegiateNumber}
                        onChangeText={SetCollegiateNumberInput}
                    />
                    <Text style={styles.psychologistHelper}>
                      O deja una descripcion con referencias: LinkedIn, Doctoralia, web profesional u otro enlace.
                    </Text>
                    <TextInput
                        autoCapitalize="sentences"
                        multiline
                        placeholder="Descripcion o enlaces de verificacion"
                        style={[styles.input, styles.psychologistDescriptionInput]}
                        textAlignVertical="top"
                        value={psychologistVerificationDescription}
                        onChangeText={SetPsychologistVerificationDescriptionInput}
                    />
                    <Text style={styles.psychologistHelper}>
                      Basta con el numero o la descripcion. No hace falta escribir ambos.
                    </Text>
                  </View>
              ) : null}
            </View>
          </ScrollView>
        </View>

        <View style={[styles.slide, styles.diagnosisScrollSlide, { width }]}>
          <ScrollView
              style={styles.slideScroll}
              contentContainerStyle={styles.slideScrollContent}
              showsVerticalScrollIndicator={true}
          >
            <View style={styles.content}>
              <Text style={styles.title}>Como te identificas ahora?</Text>
              <Text style={styles.body}>
                No necesitas tener un diagnostico para estar aqui. Puedes elegir una opcion o continuar si aun estas explorando si TEA encaja contigo.
              </Text>
              <View style={styles.diagnosisBadgePreview}>
                <DiagnosisBadge
                    diagnosis={(teaDiagnosis[0]?.value as TeaDiagnosis | undefined) ?? defaultTeaDiagnosis}
                    size="large"
                />
                <Text style={styles.diagnosisBadgePreviewText}>
                  Este distintivo cambiara de color segun la opcion que uses.
                </Text>
              </View>
              <View style={styles.diagnosisNotice}>
                <Text style={styles.diagnosisNoticeTitle}>Este paso es opcional</Text>
                <Text style={styles.diagnosisNoticeText}>
                  Si lo saltas, tu perfil mostrara una senal gris para indicar que todavia no te identificas con un diagnostico.
                </Text>
              </View>
              <SelectComponent
                  options={teaDiagnosisOptions}
                  value={teaDiagnosis}
                  onValueChange={setTeaDiagnosis}
                  maxItemsSelect={1}
                  contentItemsSize={120}
                  optionsLayout="list"
              />
            </View>
          </ScrollView>
        </View>

        <View style={[styles.registerSlide, { width }]}>
          <Register
            ref={registerRef}
            showSubmitButton={false}
            onboardingProfile={{
              userName,
              teaDiagnosis: (teaDiagnosis[0]?.value as TeaDiagnosis | undefined) ?? defaultTeaDiagnosis,
              profileImageUri,
              profileBackgroundUri,
              description: desriptionUser,
              interests,
              socialSkills: socialSkill,
              comfortOptions,
              lookingFor,
              psychologistVerification: isPsychologist
                  ? {
                    declaredPsychologist: true,
                    collegiateNumber: collegiateNumber.trim(),
                    verificationDescription: psychologistVerificationDescription.trim(),
                  }
                  : undefined,
            }}
            onStateChange={({ canSubmit, isSubmitting }) => {
              setRegisterCanSubmit(canSubmit);
              setRegisterIsSubmitting(isSubmitting);
            }}
          />
        </View>

        <View style={[styles.registerSlide, { width }]}>
          <LoginForm
            ref={loginRef}
            showSubmitButton={false}
            onStateChange={({canSubmit, isSubmitting}) => {
              setLoginCanSubmit(canSubmit);
              setLoginIsSubmitting(isSubmitting);
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
          disabled={currentIsSubmitting || !currentCanContinue || isWelcomeSlide}
          style={[
            styles.primaryButton,
            (!currentCanContinue || isWelcomeSlide)
                ? styles.disabledButton
                : styles.activeButton
          ]}
          onPress={handleNext}
        >
          {currentIsSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isRegisterSlide ? 'Crear cuenta' : isLoginSlide ? 'Entrar' : 'Siguiente'}
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
    padding: 20,
  },
  registerSlide: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  slideScroll: {
    flex: 1,
    width: '100%',
  },
  slideScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  diagnosisScrollSlide: {
    paddingHorizontal: 0,
  },
  psychologistScrollSlide: {
    paddingHorizontal: 0,
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
  optionalPhotos: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
    marginTop: 18,
    width: '100%',
  },
  backgroundPicker: {
    alignItems: 'center',
    backgroundColor: '#d7ded9',
    borderColor: '#c4cec7',
    borderRadius: 8,
    borderWidth: 1,
    height: 74,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: 140,
  },
  backgroundPreview: {
    height: '100%',
    width: '100%',
  },
  avatarPicker: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#c4cec7',
    borderRadius: 44,
    borderWidth: 1,
    height: 88,
    justifyContent: 'center',
    position: 'relative',
    width: 88,
  },
  avatarPreview: {
    borderRadius: 42,
    height: 84,
    width: 84,
  },
  photoPickerText: {
    color: '#405348',
    fontSize: 13,
    fontWeight: '800',
  },
  photoEditBadge: {
    alignItems: 'center',
    backgroundColor: '#20352b',
    borderRadius: 12,
    bottom: 5,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 5,
    width: 24,
  },
  photoEditBadgeText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 21,
  },
  inputMessage: {
    color: '#a33b30',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  psychologistOption: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d7e0d9',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    minHeight: 54,
    paddingHorizontal: 14,
    width: '100%',
  },
  psychologistCheckbox: {
    alignItems: 'center',
    borderColor: '#7b8f83',
    borderRadius: 5,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  psychologistCheckboxChecked: {
    backgroundColor: '#20352b',
    borderColor: '#20352b',
  },
  psychologistCheckboxIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  psychologistOptionText: {
    color: '#20352b',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  collegiateNumberInput: {
    width: '100%',
  },
  psychologistFields: {
    width: '100%',
  },
  psychologistDescriptionInput: {
    minHeight: 80,
    paddingTop: 10,
    width: '100%',
  },
  psychologistHelper: {
    color: '#526057',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  diagnosisNotice: {
    backgroundColor: '#eef1ef',
    borderColor: '#d4dbd7',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 12,
    width: '100%',
  },
  diagnosisBadgePreview: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    width: '100%',
  },
  diagnosisBadgePreviewText: {
    color: '#405348',
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  diagnosisNoticeTitle: {
    color: '#20352b',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  diagnosisNoticeText: {
    color: '#526057',
    fontSize: 13,
    lineHeight: 19,
  },
  welcomeActions: {
    gap: 12,
    marginTop: 26,
    width: '100%',
    maxWidth: 340,
  },
  welcomePrimaryButton: {
    alignItems: 'center',
    backgroundColor: '#20352b',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 50,
  },
  welcomePrimaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  welcomeSecondaryButton: {
    alignItems: 'center',
    borderColor: '#cdd8d0',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  welcomeSecondaryButtonText: {
    color: '#20352b',
    fontSize: 16,
    fontWeight: '800',
  },
});
